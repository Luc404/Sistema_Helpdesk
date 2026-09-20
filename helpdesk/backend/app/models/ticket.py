# ============================================
# MODEL DE TICKET (tabela "tickets")
# ============================================
# Representa um chamado de suporte aberto por um usuário.
# Contém o problema/solicitação, status, prioridade, tipo e os envolvidos
# (cliente que abriu, técnico responsável, serviço e unidade relacionados).

import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class StatusEnum(str, enum.Enum):
    """Etapa em que o chamado se encontra."""
    ABERTO = "ABERTO"                    # Aberto, aguardando atendimento
    EM_ANDAMENTO = "EM_ANDAMENTO"        # Em atendimento pelo técnico
    CONCLUIDO = "CONCLUIDO"              # Finalizado
    CANCELADO = "CANCELADO"              # Cancelado


class PrioridadeEnum(str, enum.Enum):
    """Nível de urgência do chamado."""
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)   # Identificador único
    titulo = Column(String, nullable=False)              # Título/resumo do chamado
    descricao = Column(Text, nullable=False)             # Descrição detalhada do problema
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.ABERTO, nullable=False)
    prioridade = Column(SQLEnum(PrioridadeEnum), default=PrioridadeEnum.MEDIA, nullable=False)

    # Datas de criação e de última atualização (devem ser usadas no update).
    data_criacao = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    data_atualizacao = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Chaves estrangeiras:
    # - cliente_id: quem abriu o chamado (obrigatório).
    # - tecnico_id: técnico responsável (opcional — definido ao assumir).
    # - servico_id: serviço solicitado (obrigatório).
    # - unidade_id: unidade relacionada ao chamado (obrigatório).
    cliente_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tecnico_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    servico_id = Column(Integer, ForeignKey("servicos.id"), nullable=False)
    unidade_id = Column(Integer, ForeignKey("unidades.id"), nullable=False)
    tipo_problema = Column(String, nullable=False)  # "duvida" ou "defeito"

    # Relacionamentos do ORM (back_populates casa com os models de origem).
    cliente = relationship("User", foreign_keys=[cliente_id], back_populates="chamados_criados")
    tecnico = relationship("User", foreign_keys=[tecnico_id], back_populates="chamados_atribuidos")
    servico = relationship("Servico", back_populates="tickets")
    unidade = relationship("Unidade", back_populates="tickets")
    # Cópias (usuários em cópia): se o ticket for apagado, as cópias são apagadas junto.
    copias = relationship("TicketCopia", cascade="all, delete-orphan")