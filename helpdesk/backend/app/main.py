# ============================================
# PONTO DE ENTRADA DA APLICAÇÃO (FastAPI)
# ============================================
# Cria a instância do app, configura CORS, registra todos os routers,
# cria as tabelas no banco e popula os dados iniciais na inicialização.
#
# Ordem de execução deste arquivo (importante):
#   1. importa o engine/Base e todos os models;
#   2. Base.metadata.create_all()  -> cria as tabelas que ainda não existem;
#   3. executa o seed              -> garante a unidade "Matriz" e os serviços;
#   4. instancia o FastAPI e registra os routers.
#
# O passo 3 DEVE vir depois do 2: o seed consulta e grava nas tabelas,
# então elas precisam existir antes.
#
# Para rodar em desenvolvimento:
#     uvicorn app.main:app --reload
# Documentação interativa: http://127.0.0.1:8000/docs

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import engine, Base, SessionLocal


# Importa os models para que o SQLAlchemy conheça todas as tabelas
# antes de executar o create_all abaixo.
from app.models import (
    servico,
    unidade,
    setor,
    ticket_copia,
    user,
    ticket,
    password_reset_token,
    convidado,
)

# Importa os routers de cada grupo de endpoints.
from app.routers.user_router import router as user_router
from app.routers.auth_router import router as auth_router
from app.routers.servico_router import router as servico_router
from app.routers.unidade_router import router as unidade_router
from app.routers.setor_router import router as setor_router
from app.routers.ticket_router import router as ticket_router
from app.routers.ticket_copia_router import router as ticket_copia_router
from app.routers.convidado_router import router as convidado_router
from app.routers.ws_router import router as ws_router

# Módulo de dados iniciais (cria a unidade "Matriz" se ela não existir).
from app.seed import executar_seed


def garantir_coluna_setor(db_engine) -> None:
    """Adiciona users.setor_id quando o banco já existia sem essa coluna.

    O create_all cria tabelas novas (como "setores"), mas NÃO altera uma
    tabela que já existe. Como o projeto ainda não usa Alembic, esta
    migração leve cobre justamente o caso de um banco antigo em que a
    tabela "users" foi criada antes do campo "setor_id".

    É idempotente: se a coluna já existir (banco novo), não faz nada.
    """
    inspetor = inspect(db_engine)

    # A tabela "users" ainda não existe na primeira subida? Então o
    # create_all já vai criá-la com a coluna — não há o que migrar.
    if "users" not in inspetor.get_table_names():
        return

    colunas = {coluna["name"] for coluna in inspetor.get_columns("users")}

    if "setor_id" in colunas:
        return

    with db_engine.begin() as conexao:
        conexao.execute(
            text("ALTER TABLE users ADD COLUMN setor_id INTEGER REFERENCES setores(id)")
        )


def garantir_role_admin(db_engine) -> None:
    """Adiciona o valor 'ADMIN' ao enum user_role do PostgreSQL.

    O projeto ainda não usa Alembic, e o create_all NÃO altera um enum que
    já existe. Num banco criado antes do perfil ADMIN, o tipo "user_role"
    só conhece USUARIO/TECNICO, o que faria o insert do usuário admin
    (app/seed.py) falhar.

    - PostgreSQL: ALTER TYPE ... ADD VALUE IF NOT EXISTS (idempotente).
    - SQLite: guarda enums como TEXT, então nada é necessário.
    """
    if db_engine.dialect.name != "postgresql":
        return

    try:
        with db_engine.begin() as conexao:
            conexao.execute(text("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN'"))
    except Exception as erro:  # noqa: BLE001 - migração nunca deve derrubar a API
        print(f"[main] Falha ao adicionar o valor ADMIN ao enum user_role: {erro}")


# 1. Cria as tabelas no banco automaticamente (se ainda não existirem).
#    O create_all não altera tabelas já criadas: para mudanças de coluna
#    seria preciso um migration (Alembic), que o projeto ainda não usa.
Base.metadata.create_all(bind=engine)

# 1.1. Migração leve da coluna users.setor_id (ver função acima).
garantir_coluna_setor(engine)

# 1.2. Garante o valor 'ADMIN' no enum user_role ANTES do seed criar a
#      conta do administrador (PostgreSQL; idempotente).
garantir_role_admin(engine)

# 2. Popula os dados iniciais (unidade "Matriz", serviços padrão).
#    A função é idempotente, então pode rodar em toda inicialização.
#    Uma sessão própria é aberta aqui e fechada logo em seguida, porque
#    o seed acontece fora do ciclo de requisições do FastAPI.
db_seed = SessionLocal()
try:
    executar_seed(db_seed)
finally:
    db_seed.close()

# 3. Instancia o FastAPI (APENAS UMA VEZ).
app = FastAPI(
    title="HelpDesk API",
    description="API para gerenciamento de chamados e suporte técnico",
    version="1.0.0",
)

# 4. Configuração do CORS: libera o frontend (Vite roda na porta 5173).
#    Sem isso, o navegador bloqueia as chamadas feitas pelo axios por
#    virem de outra origem (a API em :8000 e a tela em :5173).
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # Origens autorizadas
    allow_credentials=True,  # Permite cookies/credenciais
    allow_methods=["*"],     # Permite todos os métodos HTTP
    allow_headers=["*"],     # Permite todos os headers
)

# 5. Registra todos os routers na instância oficial do app.
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(servico_router)
app.include_router(unidade_router)
app.include_router(setor_router)
app.include_router(ticket_router)
app.include_router(ticket_copia_router)
app.include_router(convidado_router)
# O websocket não tem prefixo: a rota "/ws/tickets" é declarada no próprio
# router (app/routers/ws_router.py).
app.include_router(ws_router)


# ----------------------------------------------------------
# ENDPOINT: GET /  ->  Verifica se a API está no ar
# ----------------------------------------------------------
@app.get("/")
def read_root():
    """Endpoint simples para verificar se a API está no ar.

    Respostas:
      200 → { "status": "API Helpdesk rodando perfeitamente!" }.
    """
    return {"status": "API Helpdesk rodando perfeitamente!"}


# ----------------------------------------------------------
# ENDPOINT: GET /ping  ->  Teste de comunicação com o frontend
# ----------------------------------------------------------
@app.get("/ping")
def ping():
    """Endpoint para testar comunicação com o Frontend.

    É mais leve que o GET / (não consulta o banco), então serve para
    checar rapidamente se a rede entre as duas partes está funcionando.

    Respostas:
      200 → { "mensagem": "pong" }.
    """
    return {"mensagem": "pong"}
