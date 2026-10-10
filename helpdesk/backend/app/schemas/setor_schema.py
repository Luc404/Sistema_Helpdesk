# ============================================
# SCHEMAS DE SETOR
# ============================================
# Formato de entrada e saída dos setores (ex.: Financeiro, RH).
# O model correspondente está em app/models/setor.py.
# Segue o mesmo padrão dos schemas de unidade.

from pydantic import BaseModel
from typing import Optional
from app.schemas.partial import PartialUpdate


class SetorCreate(BaseModel):
    """Dados para criar um novo setor."""
    nome: str  # Nome do setor (o model define unique=True, logo não pode repetir)


class SetorResponse(BaseModel):
    """Formato retornado pela API para setores."""
    id: int    # Identificador do setor
    nome: str  # Nome do setor

    class Config:
        # Permite montar o schema a partir de um objeto do SQLAlchemy
        # (o model Setor) em vez de um dicionário.
        from_attributes = True


class SetorUpdate(PartialUpdate):
    """Dados permitidos ao editar um setor (update parcial seguro)."""
    nome: Optional[str] = None  # Novo nome (opcional)
