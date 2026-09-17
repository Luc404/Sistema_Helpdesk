from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

from app.models import ticket
from app.models import user

from app.routers.user_router import router as user_router

# 1. Cria as tabelas no banco SQLite automaticamente
Base.metadata.create_all(bind=engine)

# 2. Instancia o FastAPI (APENAS UMA VEZ)
app = FastAPI(
    title="HelpDesk API",
    description="API para gerenciamento de chamados e suporte técnico",
    version="1.0.0"
)

# 3. Configuração do CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Inclui os routers na instância oficial do app
app.include_router(user_router)

@app.get("/")
def read_root():
    return {"status": "API Helpdesk rodando perfeitamente!"}