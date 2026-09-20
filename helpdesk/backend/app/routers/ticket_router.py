from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketResponse
from app.services import ticket_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    return ticket_service.create_ticket(db, data, current_user)

@router.get("/", response_model=list[TicketResponse])
def list_tickets(db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    return ticket_service.get_tickets(db, current_user)

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    return ticket_service.can_access(db, ticket_id, current_user)

@router.put("/{ticket_id}", response_model=TicketResponse,
            dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def update_ticket(ticket_id: int, data: TicketUpdate, db: Session = Depends(get_db)):
    return ticket_service.update_ticket(db, ticket_id, data)

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    ticket_service.can_access(db, ticket_id, current_user)
    ticket_service.delete_ticket(db, ticket_id)