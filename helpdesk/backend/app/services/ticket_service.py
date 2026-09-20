from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.ticket import Ticket
from app.models.user import User, RoleEnum
from app.models.ticket_copia import TicketCopia
from app.schemas.ticket_schema import TicketCreate, TicketUpdate

def get_ticket(db: Session, ticket_id: int) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket Não Encontrado")
    return ticket

def get_tickets(db: Session, current_user: User) -> list[Ticket]:
    query = db.query(Ticket)
    if current_user.role == RoleEnum.TECNICO:
        return query.order_by(Ticket.data_criacao.desc()).all()

    ticket_ids = [
        c.ticket_id for c in db.query(TicketCopia.ticket_id).filter(TicketCopia.user_id == current_user.id)
    ]
    return (
        query.filter((Ticket.cliente_id == current_user.id) | (Ticket.id.in_(ticket_ids)))
        .order_by(Ticket.data_criacao.desc())
        .all()
    )

def create_ticket(db: Session, data: TicketCreate, cliente: User) -> Ticket:
    ticket = Ticket(
        titulo=data.titulo,
        descricao=data.descricao,
        prioridade=data.prioridade,
        cliente_id=cliente.id,
        tecnico_id=data.tecnico_id,
        servico_id=data.servico_id,
        unidade_id=data.unidade_id,
        tipo_problema=data.tipo_problema,
    )
    db.add(ticket)
    db.flush()

    for user_id in data.copia_user_ids or []:
        db.add(TicketCopia(ticket_id=ticket.id, user_id=user_id))

    db.commit()
    db.refresh(ticket)
    return ticket

def update_ticket(db: Session, ticket_id: int, data: TicketUpdate) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    for key, value in updates.items():
        setattr(ticket, key, value)
    ticket.data_atualizacao = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket

def delete_ticket(db: Session, ticket_id: int) -> None:
    ticket = get_ticket(db, ticket_id)
    db.delete(ticket)
    db.commit()

def can_access(db: Session, ticket_id: int, user: User) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    if user.role == RoleEnum.TECNICO:
        return ticket
    is_copia = db.query(TicketCopia).filter(
        TicketCopia.ticket_id == ticket_id, TicketCopia.user_id == user.id
    ).first()
    if ticket.cliente_id != user.id and not is_copia:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este ticket")
    return ticket