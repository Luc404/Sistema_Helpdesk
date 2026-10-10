# ============================================
# MODEL DE SETOR (tabela "setores")
# ============================================
# Representa um setor/departamento da empresa (ex.: Financeiro, RH, TI).
# Diferente da "unidade" (que indica o LOCAL físico, ex.: Matriz, Filial),
# o setor diz a ÁREA a que o usuário pertence.
#
# Os setores são cadastrados pelo perfil ADMIN em POST /setores/ e o
# usuário escolhe o seu no cadastro (frontend/src/pages/Cadastro.jsx).

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Setor(Base):
    # Nome real da tabela no banco.
    __tablename__ = "setores"

    id = Column(Integer, primary_key=True, index=True)   # Identificador único
    # Nome do setor. unique=True impede dois setores com o mesmo nome —
    # o service checa antes de gravar para devolver 409 em vez de erro de SQL.
    nome = Column(String, nullable=False, unique=True)

    # Relacionamentos: usuários lotados neste setor.
    usuarios = relationship("User", back_populates="setor")
