import enum
from sqlalchemy import Column, Integer, String, Enum as SQLEnum, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone

class StatusEnum(str, enum.Enum):
    ATIVO = "ATIVO"
    INATIVO = "INATIVO"
    
class RoleEnum(str, enum.Enum):
    USUARIO = "USUARIO"
    TECNICO = "TECNICO"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    data_nascimento = Column(Date, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.ATIVO, nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.USUARIO, nullable=False)
    data_criacao = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=True)

    chamados_criados = relationship("Ticket", back_populates="cliente", foreign_keys="Ticket.cliente_id")
    chamados_atribuidos = relationship("Ticket", back_populates="tecnico", foreign_keys="Ticket.tecnico_id")
    unidade = relationship("Unidade", back_populates="usuarios")
    copias_ticket = relationship("TicketCopia", back_populates="user", foreign_keys="TicketCopia.user_id")