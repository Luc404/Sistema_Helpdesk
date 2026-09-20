from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.partial import PartialUpdate

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    nova_senha: str

class PasswordResetTokenUpdate(PartialUpdate):
    token: Optional[str] = None
    expira_em: Optional[datetime] = None