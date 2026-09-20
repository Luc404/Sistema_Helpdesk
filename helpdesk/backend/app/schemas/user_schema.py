from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
from app.models.user import StatusEnum, RoleEnum
from app.schemas.partial import PartialUpdate

class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    data_nascimento: Optional[date] = None
    unidade_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    data_nascimento: Optional[date] = None
    unidade_id: Optional[int] = None
    status: StatusEnum
    role: RoleEnum
    data_criacao: datetime

    class Config:
        from_attributes = True

class UserUpdate(PartialUpdate):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    data_nascimento: Optional[date] = None
    unidade_id: Optional[int] = None
    status: Optional[StatusEnum] = None
    role: Optional[RoleEnum] = None

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse