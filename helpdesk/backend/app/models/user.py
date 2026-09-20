# ============================================
# MODEL DE USUÁRIO (tabela "users")
# ============================================
# Define a estrutura da tabela de usuários do sistema.
# Cada usuário pode ser USUARIO (abre chamados) ou TECNICO (atende chamados),
# e pode pertencer a uma unidade (ex.: Matriz, Filial).

import enum
from sqlalchemy import Column, Integer, String, Enum as SQLEnum, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class StatusEnum(str, enum.Enum):
    """Situação da conta do usuário."""
    ATIVO = "ATIVO"      # Pode acessar o sistema
    INATIVO = "INATIVO"  # Conta desativada


class RoleEnum(str, enum.Enum):
    """Papel (permissão) do usuário no sistema."""
    USUARIO = "USUARIO"  # Apenas abre/acompanha chamados
    TECNICO = "TECNICO"  # Atende e gerencia chamados, serviços e unidades


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)              # Identificador único
    nome = Column(String, nullable=False)                           # Nome completo
    data_nascimento = Column(Date, nullable=True)                   # Data de nascimento (opcional)
    email = Column(String, unique=True, index=True, nullable=False) # E-mail único (login)
    senha = Column(String, nullable=False)                          # Hash da senha (nunca texto puro)
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.ATIVO, nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.USUARIO, nullable=False)
    # Data/hora de criação com fuso horário (UTC por padrão).
    data_criacao = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Chave estrangeira: unidade a qual o usuário pertence (opcional).
    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=True)

    # Relacionamentos (apenas para consultas no ORM):
    # Depende de parâmetros extras (foreign_keys) pois Tickets tem duas FKs para users.
    chamados_criados = relationship(
        "Ticket", back_populates="cliente", foreign_keys="Ticket.cliente_id"
    )
    chamados_atribuidos = relationship(
        "Ticket", back_populates="tecnico", foreign_keys="Ticket.tecnico_id"
    )
    unidade = relationship("Unidade", back_populates="usuarios")
    # Cópias de ticket nas quais o usuário foi marcado.
    copias_ticket = relationship(
        "TicketCopia", back_populates="user", foreign_keys="TicketCopia.user_id"
    )