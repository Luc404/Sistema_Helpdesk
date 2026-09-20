# ============================================
# SCHEMAS DE REDEFINIÇÃO DE SENHA
# ============================================

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.partial import PartialUpdate


class PasswordResetRequest(BaseModel):
    """Corpo de 'esqueci minha senha': apenas o e-mail do usuário."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Corpo para efetivar a redefinição: token recebido + nova senha."""
    token: str
    nova_senha: str


class PasswordResetTokenUpdate(PartialUpdate):
    """Update parcial do token (atualmente não é usado por nenhuma rota)."""
    token: Optional[str] = None
    expira_em: Optional[datetime] = None