# ============================================
# PONTO DE ENTRADA DA APLICAÇÃO (FastAPI)
# ============================================
# Cria a instância do app, configura CORS, registra todos os routers
# e cria as tabelas no banco na inicialização.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Importa os models para que o SQLAlchemy conheça todas as tabelas
# antes de executar o create_all abaixo.
from app.models import servico, unidade, ticket_copia, user, ticket, password_reset_token

# Importa os routers de cada grupo de endpoints.
from app.routers.user_router import router as user_router
from app.routers.auth_router import router as auth_router
from app.routers.servico_router import router as servico_router
from app.routers.unidade_router import router as unidade_router
from app.routers.ticket_router import router as ticket_router
from app.routers.ticket_copia_router import router as ticket_copia_router

# 1. Cria as tabelas no banco SQLite automaticamente (se não existirem).
Base.metadata.create_all(bind=engine)

# 2. Instancia o FastAPI (APENAS UMA VEZ).
app = FastAPI(
    title="HelpDesk API",
    description="API para gerenciamento de chamados e suporte técnico",
    version="1.0.0",
)

# 3. Configuração do CORS: libera o frontend (Vite geralmente roda na 5173).
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

# 4. Registra todos os routers na instância oficial do app.
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(servico_router)
app.include_router(unidade_router)
app.include_router(ticket_router)
app.include_router(ticket_copia_router)


@app.get("/")
def read_root():
    """Endpoint simples para verificar se a API está no ar."""
    return {"status": "API Helpdesk rodando perfeitamente!"}