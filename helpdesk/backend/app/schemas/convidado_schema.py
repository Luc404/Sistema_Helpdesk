# ============================================
# SCHEMAS DE CONVIDADO (convite)
# ============================================
# Formato de entrada e saída dos convites criados pelo ADMIN.
# O model correspondente está em app/models/convidado.py.

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import RoleEnum
from app.schemas.partial import PartialUpdate


class ConvidadoCreate(BaseModel):
    """Dados para criar um convite (e-mail + perfil que ele terá)."""
    email: EmailStr  # E-mail do funcionário convidado (login do futuro cadastro)
    role: RoleEnum   # Perfil aplicado quando ele fizer o cadastro

    @field_validator("role")
    @classmethod
    def nao_convidar_admin(cls, role: RoleEnum) -> RoleEnum:
        """Impede que o papel ADMIN vaze por um convite.

        A conta de administrador é única e fixa (criada pelo seed e autenticada
        pela chave mestre); aqui o convite só pode carregar USUARIO ou TECNICO.
        """
        if role == RoleEnum.ADMIN:
            raise ValueError("Não é permitido convidar um usuário com o papel ADMIN")
        return role


class ConvidadoResponse(BaseModel):
    """Formato retornado pela API para convites."""
    id: int                              # Identificador do convite
    email: EmailStr                      # E-mail do funcionário convidado
    role: RoleEnum                       # Perfil que ele terá ao se cadastrar
    data_criacao: datetime               # Momento em que o convite foi criado

    class Config:
        # Permite montar o schema a partir de um objeto do SQLAlchemy.
        from_attributes = True


class ConvidadoUpdate(PartialUpdate):
    """Dados permitidos ao editar um convite (update parcial seguro)."""
    role: Optional[RoleEnum] = None  # Novo perfil do convite (ex.: mudou de USUARIO para TECNICO)