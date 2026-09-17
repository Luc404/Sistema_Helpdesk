from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import StatusEnum, RoleEnum

class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha_hash: str

class UserResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    status: StatusEnum
    role: RoleEnum
    data_criacao: datetime

    class Config: 
        from_attributes = True

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[StatusEnum] = None
    role: Optional[RoleEnum] = None
