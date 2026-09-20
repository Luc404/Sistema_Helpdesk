# ============================================
# MODEL DE UNIDADE (tabela "unidades")
# ============================================
# Representa uma unidade/setor do sistema (ex.: Matriz, Filial).
# Usuários pertencem a uma unidade e chamados são abertos por unidade.

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Unidade(Base):
    __tablename__ = "unidades"

    id = Column(Integer, primary_key=True, index=True)   # Identificador único
    nome = Column(String, nullable=False, unique=True)   # Nome da unidade (não pode repetir)

    # Relacionamentos: usuários e tickets vinculados a esta unidade.
    usuarios = relationship("User", back_populates="unidade")
    tickets = relationship("Ticket", back_populates="unidade")