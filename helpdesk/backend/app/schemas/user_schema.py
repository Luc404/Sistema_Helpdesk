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
    nome: str                     # Nome exibido na tela e nos chamados
    email: EmailStr               # Login do usuário (validação automática de e-mail)
    senha: str                    # Senha em texto puro — será hasheada no service
    data_nascimento: Optional[date] = None  # Opcional
    unidade_id: Optional[int] = None        # Usuário pode ser criado sem unidade


class UserResponse(BaseModel):
    """Formato retornado pela API quando um usuário é consultado/criado.

    Repare que a senha NÃO aparece aqui: ela nunca sai do backend, nem
    mesmo para o próprio usuário. O que volta é o "hash", guardado no
    model, que por segurança também não é devolvido.
    """
    id: int                            # Identificador único
    nome: str                          # Nome exibido na tela
    email: EmailStr                    # Login do usuário
    data_nascimento: Optional[date] = None  # Data de nascimento
    unidade_id: Optional[int] = None   # Unidade a qual pertence
    status: StatusEnum                 # ATIVO (entra no sistema) ou INATIVO
    role: RoleEnum                     # USUARIO ou TECNICO (permissão)
    data_criacao: datetime             # Momento do cadastro (UTC)

    class Config:
        # Permite criar o schema a partir de um objeto ORM (SQLAlchemy).
        from_attributes = True


class UserUpdate(PartialUpdate):
    """Dados permitidos ao editar um usuário (update parcial seguro).

    Herda de PartialUpdate: campos vazios viram "não alterado" e um payload
    totalmente vazio é rejeitado.

    Nem todo mundo pode preencher todos os campos: alterar "role" e "status"
    é exclusividade do perfil TÉCNICO, regra aplicada no user_router.py.
    """
    nome: Optional[str] = None             # Novo nome
    email: Optional[EmailStr] = None       # Novo login
    senha: Optional[str] = None            # Nova senha (hasheada no service)
    data_nascimento: Optional[date] = None # Nova data de nascimento
    unidade_id: Optional[int] = None       # Move o usuário para outra unidade
    status: Optional[StatusEnum] = None    # Ativa/desativa a conta (só técnico)
    role: Optional[RoleEnum] = None        # Troca o perfil (só técnico)


class UserLogin(BaseModel):
    """Corpo da requisição de login (e-mail + senha).

    É exatamente o mesmo formato aceito por UserCreate, separado só por
    clareza: o frontend envia apenas estes dois campos no POST /auth/login.
    """
    email: EmailStr  # Login do usuário
    senha: str       # Senha em texto puro (comparada com o hash do banco)


class TokenResponse(BaseModel):
    """Resposta do login: o token JWT + os dados do usuário logado.

    O "access_token" é o que o frontend guarda no localStorage e envia em
    toda requisição seguinte no header "Authorization: Bearer <token>"
    (veja services/api.ts no frontend).
    """
    access_token: str  # Token JWT assinado, válido por ACCESS_TOKEN_EXPIRE_MINUTES
    token_type: str = "bearer"  # Tipo do token (sempre "bearer")
    user: UserResponse  # Dados do usuário autenticado