# ============================================
# MODEL DE TOKEN DE REDEFINIÇÃO DE SENHA
# ============================================
# Guarda tokens gerados no fluxo "esqueci minha senha".
# O token é único, tem validade (expira_em) e está vinculado a um usuário.

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime, timezone


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)                 # Identificador único
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Usuário dono do token
    token = Column(String, nullable=False, unique=True)                # Token aleatório
    expira_em = Column(DateTime(timezone=True), nullable=False)        # Data/hora de expiração

    # Relacionamento: permite acessar o usuário dono do token.
    user = relationship("User", foreign_keys=[user_id])