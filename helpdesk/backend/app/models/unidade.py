# ============================================
# MODEL DE UNIDADE (tabela "unidades")
# ============================================
# Representa uma unidade/setor do sistema (ex.: Matriz, Filial).
# Usuários pertencem a uma unidade e chamados são abertos por unidade.
#
# A unidade "Matriz" (a sede) é criada automaticamente na inicialização
# da API pelo seed em app/seed.py. O restante (filiais, setores) é
# cadastrado pelo perfil TÉCNICO em POST /unidades/.

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Unidade(Base):
    # Nome real da tabela no banco.
    __tablename__ = "unidades"

    id = Column(Integer, primary_key=True, index=True)   # Identificador único
    # Nome da unidade. unique=True impede duas "Matriz" no mesmo banco —
    # o seed (app/seed.py) e o service checam isso antes de gravar, para
    # devolver 409 em vez de um erro de SQL.
    nome = Column(String, nullable=False, unique=True)

    # Relacionamentos: usuários e tickets vinculados a esta unidade.
    usuarios = relationship("User", back_populates="unidade")
    tickets = relationship("Ticket", back_populates="unidade")