# ============================================
# SCHEMAS DE USUÁRIO
# ============================================
# Pydantic valida os dados que entram (Create/Update/Login) e define
# o formato dos dados que saem (Response) na API.

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
from app.models.user import StatusEnum, RoleEnum
from app.schemas.partial import PartialUpdate


class UserCreate(BaseModel):
    """Dados enviados ao criar um usuário (cadastro/registro)."""
    nome: str
    email: EmailStr                 # Validação automática de e-mail
    senha: str                      # Senha em texto puro — será hasheada no service
    data_nascimento: Optional[date] = None
    unidade_id: Optional[int] = None  # Usuário pode ser criado sem unidade


class UserResponse(BaseModel):
    """Formato retornado pela API quando um usuário é consultado/criado."""
    id: int
    nome: str
    email: EmailStr
    data_nascimento: Optional[date] = None
    unidade_id: Optional[int] = None
    status: StatusEnum
    role: RoleEnum
    data_criacao: datetime

    class Config:
        # Permite criar o schema a partir de um objeto ORM (SQLAlchemy).
        from_attributes = True


class UserUpdate(PartialUpdate):
    """Dados permitidos ao editar um usuário (update parcial seguro).

    Herda de PartialUpdate: campos vazios viram "não alterado" e um payload
    totalmente vazio é rejeitado.
    """
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    data_nascimento: Optional[date] = None
    unidade_id: Optional[int] = None
    status: Optional[StatusEnum] = None
    role: Optional[RoleEnum] = None


class UserLogin(BaseModel):
    """Corpo da requisição de login (e-mail + senha)."""
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    """Resposta do login: o token JWT + os dados do usuário logado."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse