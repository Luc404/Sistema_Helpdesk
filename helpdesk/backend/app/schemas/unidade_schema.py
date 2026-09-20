# ============================================
# SCHEMAS DE UNIDADE
# ============================================

from pydantic import BaseModel
from typing import Optional
from app.schemas.partial import PartialUpdate


class UnidadeCreate(BaseModel):
    """Dados para criar uma nova unidade."""
    nome: str


class UnidadeResponse(BaseModel):
    """Formato retornado pela API para unidades."""
    id: int
    nome: str

    class Config:
        from_attributes = True


class UnidadeUpdate(PartialUpdate):
    """Dados permitidos ao editar uma unidade (update parcial seguro)."""
    nome: Optional[str] = None