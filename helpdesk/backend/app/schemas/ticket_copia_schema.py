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
    id: int         # Identificador do REGISTRO de cópia (não o do usuário)
    ticket_id: int  # Chamado ao qual a cópia pertence
    user_id: int    # Usuário em cópia

    class Config:
        # Permite montar o schema a partir de um objeto do SQLAlchemy
        # (o model TicketCopia) em vez de um dicionário.
        from_attributes = True
