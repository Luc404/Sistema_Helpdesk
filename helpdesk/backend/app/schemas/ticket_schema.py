# ============================================
# SCHEMAS DE TICKET
# ============================================
# Formato de entrada e saída dos chamados (tickets).
# O model correspondente está em app/models/ticket.py.
# Os enums StatusEnum e PrioridadeEnum são importados de lá para que
# o frontend receba exatamente os mesmos valores usados no banco.

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
    titulo: str   # Resumo do problema em uma linha (obrigatório)
    descricao: str  # Detalhamento do problema (obrigatório)
    servico_id: int                  # Serviço solicitado
    unidade_id: int                  # Unidade relacionada ao chamado
    tipo_problema: str               # "duvida" ou "defeito"
    prioridade: PrioridadeEnum = PrioridadeEnum.MEDIA  # Opcional: sem isso, MEDIA
    tecnico_id: Optional[int] = None # Técnico já pode ser indicado na abertura
    copia_user_ids: Optional[list[int]] = None  # Usuários em cópia


class TicketUpdate(PartialUpdate):
    """Dados permitidos ao editar um chamado (update parcial seguro)."""
    titulo: Optional[str] = None          # Novo título
    descricao: Optional[str] = None       # Nova descrição
    status: Optional[StatusEnum] = None   # Nova etapa do atendimento
    prioridade: Optional[PrioridadeEnum] = None  # Nova urgência
    servico_id: Optional[int] = None      # Reatribui o serviço
    unidade_id: Optional[int] = None      # Reatribui a unidade
    tipo_problema: Optional[str] = None   # "duvida" ou "defeito"
    tecnico_id: Optional[int] = None      # Define quem vai atender



class TicketResponse(BaseModel):
    """Formato retornado pela API para chamados."""
    id: int                    # Identificador do chamado
    titulo: str                # Resumo do problema
    descricao: str             # Detalhamento do problema
    status: StatusEnum         # Etapa atual do atendimento
    prioridade: PrioridadeEnum # Urgência do chamado
    tipo_problema: str         # "duvida" ou "defeito"
    data_criacao: datetime     # Quando o chamado foi aberto
    data_atualizacao: datetime # Última alteração de conteúdo ou status
    cliente_id: int            # Quem abriu (vem do token, não do body)
    tecnico_id: Optional[int] = None  # Técnico responsável (pode ser nulo)
    servico_id: int            # Serviço solicitado
    unidade_id: int            # Unidade relacionada

    class Config:
        # Permite montar o schema a partir de um objeto do SQLAlchemy
        # (o model Ticket) em vez de um dicionário.
        from_attributes = True


class TicketDetalheResponse(BaseModel):
    """Formato usado pelas telas que precisam exibir NOMES e não ids.

    Motivo: TicketResponse devolve apenas os ids (cliente_id, servico_id,
    unidade_id), mas as tabelas do frontend mostram "Nome do serviço",
    "Usuário" e "Unidade". Esta versão já resolve os ids para texto,
    evitando que o frontend precise fazer N requisições para montar a lista.
    """
    # Dados do chamado (idênticos ao TicketResponse)
    id: int                    # Identificador do chamado
    titulo: str                # Resumo do problema
    descricao: str             # Detalhamento do problema
    status: StatusEnum         # Etapa atual do atendimento
    prioridade: PrioridadeEnum # Urgência do chamado
    tipo_problema: str         # "duvida" ou "defeito"
    data_criacao: datetime     # Quando o chamado foi aberto
    data_atualizacao: datetime # Última alteração

    # Ids (úteis para Links e para o PUT de status)
    cliente_id: int                  # Quem abriu
    tecnico_id: Optional[int] = None # Técnico responsável
    servico_id: int                  # Serviço solicitado
    unidade_id: int                  # Unidade relacionada

    # Nomes resolvidos pelo backend (evitam N requisições no frontend)
    cliente_nome: str                   # Nome de quem abriu
    tecnico_nome: Optional[str] = None  # Nome do técnico (nulo se não atribuído)
    servico_nome: str                   # Nome do serviço
    unidade_nome: str                   # Nome da unidade
