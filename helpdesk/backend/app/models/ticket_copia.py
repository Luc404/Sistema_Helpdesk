from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class TicketCopia(Base):
    __tablename__ = "ticket_copias"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    ticket = relationship("Ticket", back_populates="copias")
    user = relationship("User", back_populates="copias_ticket")