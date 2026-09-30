# ============================================
# DADOS INICIAIS DO SISTEMA (seed / bootstrap)
# ============================================
# Executado UMA vez na inicialização da API (ver app/main.py). Garante que
# o banco já venha com o mínimo de dados para o sistema poder ser usado
# logo após o primeiro start, sem precisar cadastrar tudo na mão.
#
# REGRA IMPORTANTE — o seed é IDEMPOTENTE:
#   Rodar o servidor 50 vezes precisa ter o mesmo efeito de rodar 1 vez.
#   Por isso toda inserção começa verificando se o registro já existe.
#   Isso evita duplicar dados a cada reinício do uvicorn (com --reload o
#   main.py pode rodar dezenas de vezes por hora).
#
# O que é criado aqui:
#   - A unidade "Matriz" (a unidade principal/central da empresa).

from sqlalchemy.orm import Session

from app.models.unidade import Unidade
from app.models.servico import Servico


# ------------------------------------------------------------
# UNIDADES
# ------------------------------------------------------------
# A "Matriz" é a sede/central da empresa. Ela é o ponto de partida
# porque TODOS os outros fluxos dependem de existir uma unidade:
#   - o usuário pode ser vinculado a ela (User.unidade_id);
#   - o chamado é registrado em uma unidade (Ticket.unidade_id);
#   - o formulário de novo chamado usa a unidade do usuário logado
#     como valor padrão (frontend/src/pages/CriarChamado.jsx).
# Sem nenhuma unidade cadastrada, o sistema sobe mas não serve ninguém.
UNIDADES_PADRAO = [
    "Matriz",
]


def garantir_unidades(db: Session) -> list[Unidade]:
    """Garante que as unidades padrão existam no banco.

    (parametro) db: sessão do banco já aberta por quem chama.
    (retorno): lista com as unidades padrão (existentes ou recém-criadas).

    Como funciona a idempotência:
      1. Busca o registro pelo nome (Unidade.nome tem unique=True).
      2. Se achar, reaproveita — nada é criado.
      3. Se não achar, cria e adiciona à sessão.
      4. Um único commit no final grava só o que realmente faltava.
    """
    unidades = []

    for nome in UNIDADES_PADRAO:
        # Busca pelo nome porque ele é a chave natural da unidade:
        # duas "Matriz" fariam sentido, dois ids 1 e 2 não.
        existente = db.query(Unidade).filter(Unidade.nome == nome).first()

        if existente:
            # Já existe: devolve o registro pronto, sem tocar no banco.
            unidades.append(existente)
            continue

        nova_unidade = Unidade(nome=nome)
        db.add(nova_unidade)
        unidades.append(nova_unidade)

    # Grava de fato e atribui o id gerado pelo banco aos novos registros.
    db.commit()

    # Recarrega para que os objetos devolvidos tragam todos os campos
    # preenchidos (id, por exemplo) — o mesmo padrão dos outros services.
    for unidade in unidades:
        db.refresh(unidade)

    return unidades


# ------------------------------------------------------------
# SERVIÇOS
# ------------------------------------------------------------
# Serviços que o técnico oferece. Estão comentados por padrão porque o
# catálogo de serviços é definido pela empresa; descomente e ajuste
# conforme a necessidade real do projeto.
#
# Formato de cada item: (nome, descricao, icone)
#   - "icone" é o nome de uma classe do Bootstrap Icons (ex.: "bi-easel"),
#     usada no card da tela inicial (frontend/src/pages/Home.jsx).
SERVICOS_PADRAO = [
    # ("Suporte de TI", "Dificuldades com computador, e-mail ou rede.", "bi-cpu"),
    # ("Manutenção", "Chamados de manutenção preventiva do equipamento.", "bi-tools"),
]


def garantir_servicos(db: Session) -> list[Servico]:
    """Garante que os serviços padrão existam no banco (mesma lógica da unidade).

    (parametro) db: sessão do banco já aberta por quem chamada.
    (retorno): lista com os serviços padrão (existentes ou recém-criados).
    """
    servicos = []

    for nome, descricao, icone in SERVICOS_PADRAO:
        existente = db.query(Servico).filter(Servico.nome == nome).first()

        if existente:
            servicos.append(existente)
            continue

        novo_servico = Servico(nome=nome, descricao=descricao, icone=icone)
        db.add(novo_servico)
        servicos.append(novo_servico)

    db.commit()

    for servico in servicos:
        db.refresh(servico)

    return servicos


# ------------------------------------------------------------
# FUNÇÃO DE ENTRADA
# ------------------------------------------------------------
def executar_seed(db: Session) -> None:
    """Roda todos os passos de dados iniciais, na ordem correta.

    É esta função que o app/main.py chama logo depois de criar as tabelas.
    Deve ser segura para rodar em toda inicialização (idempotente) e
    nunca pode levantar exceção: se o seed falhar, a API ainda precisa
    subir para o desenvolvedor conseguir investigar o erro nos logs.
    """
    try:
        unidades = garantir_unidades(db)
        servicos = garantir_servicos(db)

        nomes_unidades = ", ".join(u.nome for u in unidades)

        print(f"[seed] Unidades disponíveis: {nomes_unidades or 'nenhuma'}")

        if servicos:
            print(f"[seed] {len(servicos)} serviço(s) disponível(is).")
    except Exception as erro:  # noqa: BLE001 - o seed nunca deve derrubar a API
        # Registra o problema e segue: a API sobe mesmo sem os dados
        # iniciais, e o técnico pode cadastrar a unidade pelo próprio
        # endpoint POST /unidades/ (que exige perfil TÉCNICO).
        print(f"[seed] Falha ao criar os dados iniciais: {erro}")
