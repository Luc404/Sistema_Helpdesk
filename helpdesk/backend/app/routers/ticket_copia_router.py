from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ticket_copia_schema import TicketCopiaCreate, TicketCopiaResponse
from app.services import ticket_copia_service, ticket_service

router = APIRouter(prefix="/tickets", tags=["Ticket Cópias"])

@router.get("/{ticket_id}/copias", response_model=list[TicketCopiaResponse])
def list_copias(ticket_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    ticket_service.can_access(db, ticket_id, current_user)
    return ticket_copia_service.get_copias(db, ticket_id)

@router.post("/{ticket_id}/copias", response_model=list[TicketCopiaResponse],
             status_code=status.HTTP_201_CREATED)
def add_copias(ticket_id: int, data: TicketCopiaCreate, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    ticket_service.can_access(db, ticket_id, current_user)
    return ticket_copia_service.add_copias(db, ticket_id, data.user_ids)

@router.delete("/{ticket_id}/copias/{copia_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_copia(ticket_id: int, copia_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    ticket_service.can_access(db, ticket_id, current_user)
    ticket_copia_service.remove_copia(db, copia_id)