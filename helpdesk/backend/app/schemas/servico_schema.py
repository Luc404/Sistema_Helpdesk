# ============================================
# SCHEMAS DE SERVIÇO
# ============================================

from pydantic import BaseModel
from typing import Optional
from app.schemas.partial import PartialUpdate


class ServicoCreate(BaseModel):
    """Dados para criar um novo serviço."""
    nome: str
    descricao: str
    icone: Optional[str] = None  # Ícone opcional usado no frontend


class ServicoResponse(BaseModel):
    """Formato retornado pela API para serviços."""
    id: int
    nome: str
    descricao: str
    icone: Optional[str] = None

    class Config:
        from_attributes = True


class ServicoUpdate(PartialUpdate):
    """Dados permitidos ao editar um serviço (update parcial seguro)."""
    nome: Optional[str] = None
    descricao: Optional[str] = None
    icone: Optional[str] = None