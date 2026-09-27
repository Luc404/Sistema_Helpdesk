# ============================================
# SCHEMAS DE REDEFINIÇÃO DE SENHA
# ============================================
# Corpos das duas etapas do fluxo "esqueci minha senha".
# O model correspondente está em app/models/password_reset_token.py.

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.partial import PartialUpdate


class PasswordResetRequest(BaseModel):
    """Corpo de 'esqueci minha senha': apenas o e-mail do usuário."""
    email: EmailStr  # E-mail cadastrado (validado pelo pydantic)


class PasswordResetConfirm(BaseModel):
    """Corpo para efetivar a redefinição: token recebido + nova senha."""
    token: str      # Token devolvido por POST /auth/forgot-password
    nova_senha: str # Nova senha (o nome é "nova_senha" por causa do schema)


class PasswordResetTokenUpdate(PartialUpdate):
    """Update parcial do token (atualmente não é usado por nenhuma rota)."""
    token: Optional[str] = None       # Novo valor de token
    expira_em: Optional[datetime] = None  # Nova data/hora de expiração
