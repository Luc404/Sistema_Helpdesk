# ============================================
# SCHEMAS DE REDEFINIÇÃO DE SENHA
# ============================================
# Define o formato de entrada e saída das DUAS etapas do fluxo
# "esqueci minha senha".
#
#   app/routers/auth_router.py
#     POST /auth/forgot-password    -> PasswordResetRequest / PasswordResetResponse
#     GET  /auth/reset-password/validar -> PasswordResetTokenStatus
#     POST /auth/reset-password     -> PasswordResetConfirm / UserResponse
#
# O model correspondente está em app/models/password_reset_token.py.

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.partial import PartialUpdate


class PasswordResetRequest(BaseModel):
    """Corpo da 1ª etapa: o usuário informa o e-mail da conta.

    Só existe um campo porque o backend não deve revelar se o e-mail está
    cadastrado — a resposta é a mesma nos dois casos.
    """
    email: EmailStr  # E-mail cadastrado (validado pelo pydantic)


class PasswordResetResponse(BaseModel):
    """Resposta da 1ª etapa.

    IMPORTANTE: em produção, os campos "token" e "link" NÃO devem ser
    devolvidos — o token tem que viajar apenas no e-mail. Aqui eles existem
    porque o projeto ainda não tem servidor SMTP configurado, e o frontend
    precisa de alguma forma de mostrar o link ao usuário em desenvolvimento.
    """
    mensagem: str  # Texto neutro, idêntico exista ou não a conta
    token: Optional[str] = None  # Token cru (só em desenvolvimento)
    link: Optional[str] = None   # Link completo de redefinição (idem)


class PasswordResetTokenStatus(BaseModel):
    """Resposta da consulta de validade do token.

    Nunca devolve erro: um token ruim vem com valido=False e o motivo no
    campo "mensagem", para a tela exibir a explicação sem try/catch.
    """
    valido: bool       # True = o token ainda pode ser usado
    mensagem: str      # Texto amigável (motivo da invalidez, quando houver)


class PasswordResetConfirm(BaseModel):
    """Corpo da 2ª etapa: o token recebido + a senha nova.

    "nova_senha" é o nome do campo porque "senha" é ambíguo aqui: a senha
    antiga já foi esquecida, então o que está sendo enviado é a NOVA.
    """
    token: str = Field(..., min_length=1, description="Token gerado na 1ª etapa")
    # O tamanho mínimo é conferido de novo no service, porque este valor
    # aqui é apenas uma primeira barreira para o Swagger.
    nova_senha: str = Field(..., min_length=1, description="Senha nova, em texto puro")


class PasswordResetTokenUpdate(PartialUpdate):
    """Update parcial do token (atualmente não é usado por nenhuma rota).

    Mantido por padronização: todo model do projeto tem o schema Create,
    Update e Response correspondentes.
    """
    token: Optional[str] = None             # Novo valor de token
    expira_em: Optional[datetime] = None    # Nova data/hora de expiração
