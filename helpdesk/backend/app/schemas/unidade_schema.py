# ============================================
# SCHEMAS DE UNIDADE
# ============================================
# Formato de entrada e saída das unidades (ex.: Matriz, Filial).
# O model correspondente está em app/models/unidade.py.

from pydantic import BaseModel
from typing import Optional
from app.schemas.partial import PartialUpdate


class UnidadeCreate(BaseModel):
    """Dados para criar uma nova unidade."""
    nome: str  # Nome da unidade (o model define unique=True, logo não pode repetir)


class UnidadeResponse(BaseModel):
    """Formato retornado pela API para unidades."""
    id: int   # Identificador da unidade
    nome: str  # Nome da unidade

    class Config:
        # Permite montar o schema a partir de um objeto do SQLAlchemy
        # (o model Unidade) em vez de um dicionário.
        from_attributes = True


class UnidadeUpdate(PartialUpdate):
    """Dados permitidos ao editar uma unidade (update parcial seguro)."""
    nome: Optional[str] = None  # Novo nome (opcional)
