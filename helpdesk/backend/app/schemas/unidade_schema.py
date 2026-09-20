from pydantic import BaseModel
from typing import Optional
from app.schemas.partial import PartialUpdate

class UnidadeCreate(BaseModel):
    nome: str

class UnidadeResponse(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True

class UnidadeUpdate(PartialUpdate):
    nome: Optional[str] = None