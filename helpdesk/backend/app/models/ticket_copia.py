# ============================================
# MODEL DE TICKET CÓPIA (tabela "ticket_copias")
# ============================================
# Representa os "usuários em cópia" de um chamado: pessoas que não abriram
# o ticket, mas devem acompanhá-lo. É uma tabela associativa (N tickets <-> N users).

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TicketCopia(Base):
    __tablename__ = "ticket_copias"

    id = Column(Integer, primary_key=True, index=True)                 # Identificador único
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)  # Ticket copiado
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)      # Usuário em cópia

    # Relacionamentos do ORM para facilitar consultas.
    ticket = relationship("Ticket", back_populates="copias")
    user = relationship("User", back_populates="copias_ticket")