# ============================================
# SERVICE DE TICKET CÓPIA (regras de negócio)
# ============================================
# Gerencia os "usuários em cópia" de um chamado: adicionar, listar e remover.

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.ticket_copia import TicketCopia


def get_copia(db: Session, copia_id: int) -> TicketCopia:
    """Busca um registro de cópia pelo id; lança 404 se não existir."""
    copia = db.query(TicketCopia).filter(TicketCopia.id == copia_id).first()
    if not copia:
        raise HTTPException(status_code=404, detail="Cópia Não Encontrada")
    return copia


def get_copias(db: Session, ticket_id: int) -> list[TicketCopia]:
    """Lista todas as cópias de um ticket."""
    return db.query(TicketCopia).filter(TicketCopia.ticket_id == ticket_id).all()


def add_copias(db: Session, ticket_id: int, user_ids: list[int]) -> list[TicketCopia]:
    """Adiciona usuários em cópia a um ticket (ignora duplicados)."""
    novas = []
    for user_id in user_ids:
        existe = db.query(TicketCopia).filter(
            TicketCopia.ticket_id == ticket_id, TicketCopia.user_id == user_id
        ).first()
        if not existe:
            novas.append(TicketCopia(ticket_id=ticket_id, user_id=user_id))
    if novas:
        db.add_all(novas)
        db.commit()
    return get_copias(db, ticket_id)


def remove_copia(db: Session, copia_id: int) -> None:
    """Remove uma cópia do ticket."""
    copia = get_copia(db, copia_id)
    db.delete(copia)
    db.commit()