from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TicketCreate(BaseModel):
    titulo: str
    descricao: str

class TicketResponse(BaseModel):
    id: int
    titulo: str
    descricao: str
    data_criacao: datetime
    cliente_id: Optional[int] = None
    tecnico_id: Optional[int] = None

    class Config:
        from_attributes = True