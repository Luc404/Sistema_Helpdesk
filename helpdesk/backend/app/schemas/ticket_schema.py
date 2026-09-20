# ============================================
# SCHEMAS DE TICKET
# ============================================

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.ticket import StatusEnum, PrioridadeEnum
from app.schemas.partial import PartialUpdate


class TicketCreate(BaseModel):
    """Dados enviados ao abrir um chamado.

    O cliente_id NÃO é enviado aqui: ele vem do usuário autenticado
    (current_user) dentro do service.
    """
    titulo: str
    descricao: str
    servico_id: int                  # Serviço solicitado
    unidade_id: int                  # Unidade relacionada ao chamado
    tipo_problema: str               # "duvida" ou "defeito"
    prioridade: PrioridadeEnum = PrioridadeEnum.MEDIA
    tecnico_id: Optional[int] = None # Técnico já pode ser indicado na abertura
    copia_user_ids: Optional[list[int]] = None  # Usuários em cópia


class TicketUpdate(PartialUpdate):
    """Dados permitidos ao editar um chamado (update parcial seguro)."""
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[StatusEnum] = None
    prioridade: Optional[PrioridadeEnum] = None
    servico_id: Optional[int] = None
    unidade_id: Optional[int] = None
    tipo_problema: Optional[str] = None
    tecnico_id: Optional[int] = None


class TicketResponse(BaseModel):
    """Formato retornado pela API para chamados."""
    id: int
    titulo: str
    descricao: str
    status: StatusEnum
    prioridade: PrioridadeEnum
    tipo_problema: str
    data_criacao: datetime
    data_atualizacao: datetime
    cliente_id: int
    tecnico_id: Optional[int] = None
    servico_id: int
    unidade_id: int

    class Config:
        from_attributes = True