# ============================================
# ROUTER DE TICKETS (endpoints /tickets)
# ============================================
# Grupo de rotas responsável pelo uso de chamados (abrir, listar, editar...).
#
# Permissões / regras:
#   - Abrir (POST) e listar (GET) exigem usuário logado (token).
#   - Editar conteúdo (PUT) exige papel TÉCNICO.
#   - Excluir (DELETE): técnico ou o próprio dono do ticket.
#   - Visibilidade: técnico vê todos; usuário vê os próprios + os em cópia.
#
# As docstrings de cada endpoint aparecem também no Swagger.

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketResponse
from app.services import ticket_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])


# ----------------------------------------------------------
# ROTA: POST /tickets  ->  Abrir chamado
# ----------------------------------------------------------
@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Abre um novo chamado.
    Acesso: qualquer usuário logado (o autor é identificado pelo token).

    Body esperado (JSON):
        {
          "titulo": "Solicitar treinamento",
          "descricao": "Preciso de treinamento no sistema",
          "servico_id": 1,                    // obrigatório
          "unidade_id": 1,                    // obrigatório
          "tipo_problema": "duvida",          // "duvida" ou "defeito"
          "prioridade": "BAIXA",              // opcional (default MEDIA)
          "tecnico_id": 1,                    // opcional
          "copia_user_ids": [2, 3]            // opcional: usuários em cópia
        }

    IMPORTANTE: o campo cliente_id NÃO é enviado — o service usa o usuário
    autenticado (current_user) como cliente do chamado.

    O que acontece por dentro:
      1. ticket_service.create_ticket monta o Ticket.
      2. Se copia_user_ids vier preenchido, cria os registros de cópia.

    Respostas:
      201 → ticket criado.
      401 → usuário não autenticado.
      422 → body inválido (campos obrigatórios ausentes).
    """
    return ticket_service.create_ticket(db, data, current_user)


# ----------------------------------------------------------
# ROTA: GET /tickets  ->  Listar chamados
# ----------------------------------------------------------
@router.get("/", response_model=list[TicketResponse])
def list_tickets(db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Lista os chamados conforme o perfil do usuário logado.

    Regras de visibilidade (aplicadas em ticket_service.get_tickets):
      - TÉCNICO: recebe TODOS os chamados (mais recentes primeiro).
      - USUÁRIO: recebe apenas os que abriu + os que está em cópia.

    Respostas:
      200 → lista de tickets (array JSON).
      401 → usuário não autenticado.
    """
    return ticket_service.get_tickets(db, current_user)


# ----------------------------------------------------------
# ROTA: GET /tickets/{ticket_id}  ->  Detalhar chamado
# ----------------------------------------------------------
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Retorna um chamado específico.
    Acesso: usuário autenticado com permissão sobre o ticket
            (técnico sempre pode; usuário só os seus / cópias).

    Parâmetro de URL:
      - ticket_id (int): id do ticket.

    Respostas:
      200 → dados do ticket.
      401 → não autenticado.
      403 → usuário sem permissão sobre este ticket.
      404 → ticket não encontrado.
    """
    return ticket_service.can_access(db, ticket_id, current_user)


# ----------------------------------------------------------
# ROTA: PUT /tickets/{ticket_id}  ->  Editar chamado
# ----------------------------------------------------------
@router.put("/{ticket_id}", response_model=TicketResponse,
            dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def update_ticket(ticket_id: int, data: TicketUpdate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Edita um chamado (status, prioridade, técnico, conteúdo).
    Acesso: somente TÉCNICO.

    Parâmetro de URL:
      - ticket_id (int): id do ticket a ser editado.

    Body esperado (JSON) — UPDATE PARCIAL:
      Envie somente o que deseja alterar, por exemplo:
        { "status": "EM_ANDAMENTO", "tecnico_id": 1 }

    Regras importantes:
      - Campos vazios/nulos NÃO sobrescrevem o valor atual.
      - O timestamp data_atualizacao é atualizado automaticamente.

    Respostas:
      200 → ticket atualizado.
      403 → usuário não é técnico.
      404 → ticket não encontrado.
      422 → body sem nenhum campo válido.
    """
    return ticket_service.update_ticket(db, ticket_id, data)


# ----------------------------------------------------------
# ROTA: DELETE /tickets/{ticket_id}  ->  Remover chamado
# ----------------------------------------------------------
@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Remove um chamado (as cópias são removidas em cascata).
    Acesso: técnico ou o próprio dono do ticket.

    Parâmetro de URL:
      - ticket_id (int): id do ticket a ser removido.

    Respostas:
      204 → removido com sucesso.
      401 → não autenticado.
      403 → usuário sem permissão sobre este ticket.
      404 → ticket não encontrado.
    """
    ticket_service.can_access(db, ticket_id, current_user)
    ticket_service.delete_ticket(db, ticket_id)