from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

from app.models import servico, unidade, ticket_copia, user, ticket, password_reset_token

from app.routers.user_router import router as user_router
from app.routers.auth_router import router as auth_router
from app.routers.servico_router import router as servico_router
from app.routers.unidade_router import router as unidade_router
from app.routers.ticket_router import router as ticket_router
from app.routers.ticket_copia_router import router as ticket_copia_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HelpDesk API",
    description="API para gerenciamento de chamados e suporte técnico",
    version="1.0.0"
)

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

app.include_router(user_router)
app.include_router(auth_router)
app.include_router(servico_router)
app.include_router(unidade_router)
app.include_router(ticket_router)
app.include_router(ticket_copia_router)

@app.get("/")
def read_root():
    return {"status": "API Helpdesk rodando perfeitamente!"}