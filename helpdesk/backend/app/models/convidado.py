# ============================================
# MODEL DE CONVIDADO/INVITE (tabela "convidados")
# ============================================
# Representa um convite criado pelo ADMIN para um funcionário.
#
# FLUXO:
#   1. O ADMIN informa o e-mail do funcionário e o perfil que ele deve ter
#      (USUARIO ou TECNICO) em POST /convidados/.
#   2. Quando esse funcionário fizer o CADASTRO público (POST /auth/register)
#      com o mesmo e-mail, o sistema aplica o papel do convite automaticamente
#      e consome (apaga) o convite.
#   3. Ao efetuar o login, o usuário já nasce com o perfil certo e é
#      direcionado para a página do seu papel.
#
# Obs.: admins NÃO são criados por convite — existe apenas a conta fixa
# autenticada pela chave mestre (veja app/seed.py).

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SQLEnum, Integer, String

from app.database import Base
from app.models.user import RoleEnum


class Convidado(Base):
    # Nome real da tabela no banco.
    __tablename__ = "convidados"

    id = Column(Integer, primary_key=True, index=True)              # Identificador único
    # E-mail do funcionário convidado. unique=True garante um único convite
    # por e-mail; o service devolve 409 em vez de erro de SQL.
    email = Column(String, unique=True, index=True, nullable=False)
    # Perfil que o funcionário terá ao se cadastrar com este e-mail.
    # O name="convidado_role" dá um nome único ao tipo enum no PostgreSQL.
    role = Column(SQLEnum(RoleEnum, name="convidado_role"), nullable=False)
    # Data/hora em que o convite foi criado (UTC por padrão).
    data_criacao = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))