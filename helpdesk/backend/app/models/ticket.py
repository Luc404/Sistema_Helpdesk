import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone

class StatusEnum(str, enum.Enum):
    ABERTO = "ABERTO"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO = "CANCELADO"

class PrioridadeEnum(str, enum.Enum):
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False)
    descricao = Column(Text, nullable=False)
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.ABERTO, nullable=False)
    prioridade = Column(SQLEnum(PrioridadeEnum), default=PrioridadeEnum.MEDIA, nullable=False)

    data_criacao = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    data_atualizacao = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    cliente_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tecnico_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    cliente = relationship("User", foreign_keys=[cliente_id], back_populates="chamados_criados")
    tecnico = relationship("User", foreign_keys=[tecnico_id], back_populates="chamados_atribuidos")