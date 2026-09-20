from pydantic import BaseModel
from typing import Optional
from app.schemas.partial import PartialUpdate

class ServicoCreate(BaseModel):
    nome: str
    descricao: str
    icone: Optional[str] = None

class ServicoResponse(BaseModel):
    id: int
    nome: str
    descricao: str
    icone: Optional[str] = None

    class Config:
        from_attributes = True

class ServicoUpdate(PartialUpdate):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    icone: Optional[str] = None