# ============================================
# ROUTER DE TICKET CÓPIA (endpoints /tickets/{id}/copias)
# ============================================
# Grupo de rotas responsável pelos "usuários em cópia" de um chamado.
# Cópia = pessoa que acompanha o ticket sem tê-lo aberto.
#
# Regras:
#   - Todas as rotas exigem login e permissão de acesso ao ticket.
#   - Não existe limite de cópias por ticket (pode repetir/proliferar).
#
# As docstrings de cada endpoint aparecem também no Swagger.

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ticket_copia_schema import TicketCopiaCreate, TicketCopiaResponse
from app.services import ticket_copia_service, ticket_service

# Prefixo "/tickets" para que a URL completa fique /tickets/{id}/copias.
router = APIRouter(prefix="/tickets", tags=["Ticket Cópias"])


# ----------------------------------------------------------
# ROTA: GET /tickets/{ticket_id}/copias  ->  Listar cópias
# ----------------------------------------------------------
@router.get("/{ticket_id}/copias", response_model=list[TicketCopiaResponse])
async def list_copias(ticket_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Lista os usuários que estão em cópia de um ticket.
    Acesso: usuário autenticado com permissão sobre o ticket.

    Parâmetro de URL:
      - ticket_id (int): id do ticket.

    Respostas:
      200 → lista de cópias (array JSON).
      401 → não autenticado.
      403 → usuário sem permissão sobre este ticket.
      404 → ticket não encontrado.
    """
    # Antes de listar, garante que o usuário tem acesso ao ticket.
    ticket_service.can_access(db, ticket_id, current_user)
    return ticket_copia_service.get_copias(db, ticket_id)


# ----------------------------------------------------------
# ROTA: POST /tickets/{ticket_id}/copias  ->  Adicionar cópias
# ----------------------------------------------------------
@router.post("/{ticket_id}/copias", response_model=list[TicketCopiaResponse],
             status_code=status.HTTP_201_CREATED)
async def add_copias(ticket_id: int, data: TicketCopiaCreate, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Adiciona usuários em cópia a um ticket.
    Acesso: usuário autenticado com permissão sobre o ticket.

    Body esperado (JSON):
        { "user_ids": [2, 3] }   // lista de ids de usuários

    O que acontece por dentro:
      - ticket_copia_service.add_copias ignora duplicados (usuário que já
        está em cópia não é adicionado novamente).

    Respostas:
      201 → lista atualizada de cópias do ticket.
      401 → não autenticado.
      403 → usuário sem permissão sobre este ticket.
      404 → ticket não encontrado.
      422 → body inválido (user_ids ausente/vazio).
    """
    ticket_service.can_access(db, ticket_id, current_user)
    return ticket_copia_service.add_copias(db, ticket_id, data.user_ids)


# ----------------------------------------------------------
# ROTA: DELETE /tickets/{ticket_id}/copias/{copia_id}  ->  Remover cópia
# ----------------------------------------------------------
@router.delete("/{ticket_id}/copias/{copia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_copia(ticket_id: int, copia_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Remove um usuário da lista de cópias de um ticket.
    Acesso: usuário autenticado com permissão sobre o ticket.

    Parâmetros de URL:
      - ticket_id (int): id do ticket.
      - copia_id (int): id do registro de cópia a ser removido.

    Respostas:
      204 → removido com sucesso.
      401 → não autenticado.
      403 → usuário sem permissão sobre este ticket.
      404 → ticket ou cópia não encontrada.
    """
    ticket_service.can_access(db, ticket_id, current_user)
    ticket_copia_service.remove_copia(db, copia_id)