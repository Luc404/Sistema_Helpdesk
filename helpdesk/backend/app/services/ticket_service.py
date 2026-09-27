# ============================================
# SERVICE DE TICKET (regras de negócio)
# ============================================
# Lógica de abertura, listagem, edição e remoção de chamados,
# incluindo as regras de visibilidade (quem pode ver qual ticket)
# e a criação das cópias (usuários em cópia).

from datetime import datetime, timezone
from sqlalchemy.orm import Session, aliased
from fastapi import HTTPException

from app.models.servico import Servico
from app.models.ticket import Ticket
from app.models.unidade import Unidade
from app.models.user import User, RoleEnum
from app.models.ticket_copia import TicketCopia
from app.schemas.ticket_schema import TicketCreate, TicketUpdate


def get_ticket(db: Session, ticket_id: int) -> Ticket:
    """Busca um ticket pelo id; lança 404 se não existir."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket Não Encontrado")
    return ticket


def query_visiveis(db: Session, current_user: User):
    """Monta a query de tickets que o usuário logado pode enxergar.

    Fica em uma função à parte para que `get_tickets` e `get_tickets_detalhe`
    apliquem exatamente a mesma regra de visibilidade, sem duplicar o código.

    Regras:
      - TÉCNICO: todos os chamados.
      - USUÁRIO: os que ele abriu + os que está em cópia.
    """
    query = db.query(Ticket)

    if current_user.role == RoleEnum.TECNICO:
        return query

    # Ids dos tickets onde o usuário atual aparece em cópia.
    ticket_ids_em_copia = [
        c.ticket_id
        for c in db.query(TicketCopia.ticket_id).filter(TicketCopia.user_id == current_user.id)
    ]

    return query.filter(
        (Ticket.cliente_id == current_user.id) | (Ticket.id.in_(ticket_ids_em_copia))
    )


def get_tickets(db: Session, current_user: User) -> list[Ticket]:
    """Lista os tickets (com ids) visíveis para o usuário, mais recentes primeiro."""
    return (
        query_visiveis(db, current_user)
        .order_by(Ticket.data_criacao.desc())
        .all()
    )


def get_tickets_detalhe(db: Session, current_user: User) -> list[dict]:
    """Lista os tickets visíveis já com os NOMES de cliente, técnico, serviço e unidade.

    Usa o JOIN do SQLAlchemy para trazer os nomes em uma única consulta,
    evitando o problema de N+1 (uma requisição por chamado) no backend.
    """
    # JOIN 1x1 com as tabelas relacionadas.
    # "aliased" é obrigatório aqui: a tabela "users" aparece DUAS vezes no
    # SELECT (uma como cliente, outra como técnico). Sem o apelido, o SQL
    # ficaria ambíguo ("users.id") e o banco lançaria erro.
    cliente = aliased(User)
    tecnico = aliased(User)

    linhas = (
        query_visiveis(db, current_user)
        .join(cliente, Ticket.cliente_id == cliente.id)
        .join(Servico, Ticket.servico_id == Servico.id)
        .join(Unidade, Ticket.unidade_id == Unidade.id)
        .outerjoin(tecnico, Ticket.tecnico_id == tecnico.id)
        # "with_entities" define o que sai no SELECT. Sem ele, o .join()
        #iltraria as linhas mas devolveria só a entidade Ticket, e o
        # unpack "for t, cli, ... in linhas" quebraria.
        .with_entities(Ticket, cliente, Servico, Unidade, tecnico)
        .order_by(Ticket.data_criacao.desc())
        .all()
    )

    tickets = []

    # Cada linha vem do JOIN acima já com as 5 entidades preenchidas.
    # Montamos um dicionário (e não o model Ticket) porque o schema
    # TicketDetalheResponse precisa dos campos "*_nome", que não existem
    # na tabela "tickets" — eles vêm do JOIN.
    for t, cli, servico, unidade, tec in linhas:
        tickets.append(
            {
                # Dados do chamado (tabela "tickets")
                "id": t.id,
                "titulo": t.titulo,
                "descricao": t.descricao,
                "status": t.status,
                "prioridade": t.prioridade,
                "tipo_problema": t.tipo_problema,
                "data_criacao": t.data_criacao,
                "data_atualizacao": t.data_atualizacao,
                # Ids das relações (mantidos para o frontend montar links)
                "cliente_id": t.cliente_id,
                "tecnico_id": t.tecnico_id,
                "servico_id": t.servico_id,
                "unidade_id": t.unidade_id,
                # Nomes resolvidos pelo JOIN
                "cliente_nome": cli.nome,
                # outerjoin: chamado sem técnico devolve None, não erro.
                "tecnico_nome": tec.nome if tec else None,
                "servico_nome": servico.nome,
                "unidade_nome": unidade.nome,
            }
        )

    return tickets


def create_ticket(db: Session, data: TicketCreate, cliente: User) -> Ticket:
    """Abre um novo chamado.

    - O cliente é o usuário autenticado (não vem do body).
    - Cria também os registros de cópia caso `copia_user_ids` seja enviado.
    """
    ticket = Ticket(
        titulo=data.titulo,
        descricao=data.descricao,
        prioridade=data.prioridade,
        cliente_id=cliente.id,
        tecnico_id=data.tecnico_id,
        servico_id=data.servico_id,
        unidade_id=data.unidade_id,
        tipo_problema=data.tipo_problema,
    )
    db.add(ticket)
    # flush() grava o INSERT sem fechar a transação: é o que faz o ticket.id
    # existir já neste ponto, permitindo que as cópias abaixo sejam criadas com ele.
    db.flush()

    # Um registro de cópia por id enviado. O acesso ao ticket já foi
    # garantido pelo router antes de chegar aqui.
    for user_id in data.copia_user_ids or []:
        db.add(TicketCopia(ticket_id=ticket.id, user_id=user_id))

    db.commit()
    db.refresh(ticket)
    return ticket


def update_ticket(db: Session, ticket_id: int, data: TicketUpdate) -> Ticket:
    """Edita apenas os campos enviados e atualiza data_atualizacao.

    O update é parcial: "exclude_unset=True" traz só o que o técnico
    enviou e o filtro "is not None" descarta nulos/vazios. Assim, um PUT
    com {"status": "EM_ANDAMENTO"} não apaga título, descrição ou técnico.
    """
    ticket = get_ticket(db, ticket_id)
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}

    # setattr aplica cada chave (titulo, status, ...) direto no objeto.
    for key, value in updates.items():
        setattr(ticket, key, value)

    # Carimbo de última alteração, sempre atualizado nesta rota.
    ticket.data_atualizacao = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


def delete_ticket(db: Session, ticket_id: int) -> None:
    """Remove um ticket (as cópias são removidas em cascata).

    A cascata vem do relationship "copias" com cascade="all, delete-orphan"
    definido em app/models/ticket.py — não é preciso apagar as cópias aqui.
    """
    ticket = get_ticket(db, ticket_id)
    db.delete(ticket)
    db.commit()


def can_access(db: Session, ticket_id: int, user: User) -> Ticket:
    """Verifica se o usuário pode acessar um ticket específico.

    - TÉCNICO: sempre pode.
    - USUÁRIO: apenas se abriu o ticket ou está em cópia (senão -> 403).
    """
    ticket = get_ticket(db, ticket_id)

    # Técnico enxerga qualquer chamado da fila.
    if user.role == RoleEnum.TECNICO:
        return ticket

    # Para o usuário comum, basta estar na lista de cópias do ticket.
    is_copia = db.query(TicketCopia).filter(
        TicketCopia.ticket_id == ticket_id, TicketCopia.user_id == user.id
    ).first()

    # Não é dono e não está em cópia -> recusa o acesso.
    if ticket.cliente_id != user.id and not is_copia:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este ticket")

    return ticket
