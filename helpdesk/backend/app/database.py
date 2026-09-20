# ============================================
# CONEXÃO COM O BANCO DE DADOS
# ============================================
# Responsável por criar a engine, a sessão e a base declarativa do SQLAlchemy.
# Banco utilizado: SQLite (arquivo helpdesk.db na raiz do backend).

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# URL de conexão com o banco SQLite.
SQLALCHEMY_DATABASE_URL = "sqlite:///./helpdesk.db"

# Cria a engine de conexão.
# check_same_thread=False é necessário porque o SQLite é usado com FastAPI
# (que pode acessar o banco por threads diferentes).
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# "Fábrica" de sessões: cada sessão representa uma conexão/transação com o banco.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base declarativa: todos os models (tabelas) herdam dela.
Base = declarative_base()


def get_db():
    """
    Dependência do FastAPI que fornece uma sessão do banco por requisição.
    Usada nos routers como: db: Session = Depends(get_db).
    Garante que a sessão seja sempre fechada, mesmo em caso de erro.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()