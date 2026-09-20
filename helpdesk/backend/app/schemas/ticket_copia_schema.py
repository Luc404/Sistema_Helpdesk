# ============================================
# SCHEMAS DE TICKET CÓPIA
# ============================================
# Usado para gerenciar os "usuários em cópia" de um chamado.

from pydantic import BaseModel


class TicketCopiaCreate(BaseModel):
    """Corpo para adicionar usuários em cópia a um ticket."""
    user_ids: list[int]  # Lista de ids de usuários para incluir na cópia


class TicketCopiaResponse(BaseModel):
    """Formato retornado pela API para cada item de cópia."""
    id: int
    ticket_id: int
    user_id: int

    class Config:
        from_attributes = True