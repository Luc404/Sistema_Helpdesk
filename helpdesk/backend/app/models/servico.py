# ============================================
# MODEL DE SERVIÇO (tabela "servicos")
# ============================================
# Representa um tipo de serviço oferecido (ex.: Treinamento Básico).
# Os chamados são abertos vinculados a um serviço.

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Servico(Base):
    __tablename__ = "servicos"

    id = Column(Integer, primary_key=True, index=True) # Identificador único
    nome = Column(String, nullable=False)              # Nome do serviço
    descricao = Column(String, nullable=False)         # O que o serviço cobre
    icone = Column(String, nullable=True)              # Ícone/emblem para o frontend

    # Relacionamento: lista de tickets abertos para este serviço.
    tickets = relationship("Ticket", back_populates="servico")