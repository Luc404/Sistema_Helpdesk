# ============================================
# MODEL DE SERVIÇO (tabela "servicos")
# ============================================
# Representa um tipo de serviço oferecido (ex.: Treinamento Básico).
# Os chamados são abertos vinculados a um serviço.

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Servico(Base):
    # Nome real da tabela no banco.
    __tablename__ = "servicos"

    id = Column(Integer, primary_key=True, index=True)  # Identificador único
    nome = Column(String, nullable=False)                # Nome do serviço
    descricao = Column(String, nullable=False)           # O que o serviço cobre
    # Classe de ícone do Bootstrap Icons usada no card da tela inicial
    # (ex.: "bi-easel"). Nulo = o frontend usa um ícone padrão.
    icone = Column(String, nullable=True)

    # Relacionamento: lista de tickets abertos para este serviço.
    tickets = relationship("Ticket", back_populates="servico")