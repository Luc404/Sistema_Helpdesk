from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TicketCopiaCreate(BaseModel):
    user_ids: list[int]

class TicketCopiaResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int

    class Config:
        from_attributes = True