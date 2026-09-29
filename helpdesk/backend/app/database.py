# ============================================
# CONEXÃO COM O BANCO DE DADOS
# ============================================
# Responsável por criar a engine, a sessão e a base declarativa do SQLAlchemy.
# Banco utilizado: definido em DATABASE_URL no arquivo .env
# (PostgreSQL em produção; SQLite como padrão se a variável não existir).

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# URL de conexão lida do .env (via app/config.py).
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# check_same_thread só existe no SQLite; no PostgreSQL não deve ser passado.
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

# Cria a engine de conexão.
# pool_pre_ping=True testa a conexão antes de usar, evitando erro quando o
# banco na nuvem "dorme" por inatividade.
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

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