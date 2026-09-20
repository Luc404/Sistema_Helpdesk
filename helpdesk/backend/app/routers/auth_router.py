# ============================================
# ROUTER DE AUTENTICAÇÃO (endpoints /auth)
# ============================================
# Grupo de rotas responsável por:
#   - Cadastro (register)
#   - Login (gera token JWT usado nas demais rotas protegidas)
#   - Consulta do usuário logado (me)
#   - Recuperação de senha (forgot-password / reset-password)
#
# As docstrings de cada endpoint aparecem também no Swagger.

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserLogin, UserResponse, TokenResponse
from app.security import create_access_token
from app.schemas.password_reset_token_schema import PasswordResetRequest, PasswordResetConfirm
from app.services import user_service, password_reset_token_service

router = APIRouter(prefix="/auth", tags=["Autenticação"])


# ----------------------------------------------------------
# ROTA: POST /auth/register  ->  Cadastro de usuário
# ----------------------------------------------------------
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Cadastra um novo usuário (equivalente a POST /users/).

    Body esperado (JSON):
        {
          "nome": "Lucas",
          "email": "lucas@teste.com",
          "senha": "123456",
          "data_nascimento": "1995-01-01",   // opcional
          "unidade_id": 1                    // opcional
        }

    O que acontece por dentro:
      1. Valida o body com o schema UserCreate (e-mail obrigatório/válido).
      2. user_service.create_user verifica se o e-mail já existe.
      3. A senha é hasheada antes de ser salva.

    Respostas:
      201 → usuário criado (retorna os dados sem a senha).
      409 → e-mail já cadastrado.
      422 → body inválido (ex.: e-mail mal formatado).
    """
    return user_service.create_user(db, user)


# ----------------------------------------------------------
# ROTA: POST /auth/login  ->  Login (obter token)
# ----------------------------------------------------------
@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Autentica o usuário e devolve o token de acesso.

    Body esperado (JSON):
        { "email": "lucas@teste.com", "senha": "123456" }

    O que acontece por dentro:
      1. user_service.authenticate_user verifica e-mail e senha (hash).
      2. Se válido, gera um token JWT contendo o id do usuário no campo "sub".
      3. Retorna o token + os dados do usuário.

    Como usar o token:
      - Nas rotas protegidas, envie no header:
          Authorization: Bearer <access_token>
      - O Swagger já tem o botão "Authorize" para isso.

    Respostas:
      200 → { access_token, token_type, user }.
      401 → e-mail ou senha incorretos.
      403 → usuário inativo.
    """
    user = user_service.authenticate_user(db, data.email, data.senha)
    # O "sub" do token guarda o id do usuário autenticado.
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=user)


# ----------------------------------------------------------
# ROTA: GET /auth/me  ->  Usuário logado
# ----------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Retorna os dados do usuário que está logado.

    Proteção: exige token Bearer válido (caso contrário -> 401).

    O que acontece por dentro:
      - A dependência get_current_user decodifica o token do header
        Authorization, busca o usuário no banco e o injeta na função.

    Respostas:
      200 → dados do usuário autenticado.
      401 → token ausente/inválido/expirado ou usuário inativo.
    """
    return current_user


# ----------------------------------------------------------
# ROTA: POST /auth/forgot-password  ->  Solicitar redefinição
# ----------------------------------------------------------
@router.post("/forgot-password")
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Gera um token para redefinir a senha de um usuário.

    Body esperado (JSON):
        { "email": "lucas@teste.com" }

    O que acontece por dentro:
      1. Verifica se existe um usuário ATIVO com esse e-mail.
      2. Gera um token aleatório com validade de 2 horas
         (password_reset_token_service.create_reset_token).
      3. Retorna o token no corpo — em produção ele seria enviado por e-mail.

    Respostas:
      200 → { mensagem, token }.
      404 → usuário não encontrado / inativo.
    """
    token = password_reset_token_service.create_reset_token(db, data.email)
    return {"mensagem": "Token de redefinição gerado", "token": token}


# ----------------------------------------------------------
# ROTA: POST /auth/reset-password  ->  Efetivar redefinição
# ----------------------------------------------------------
@router.post("/reset-password", response_model=UserResponse)
def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Troca a senha usando o token recebido por e-mail.

    Body esperado (JSON):
        {
          "token": "token-gerado-no-forgot-password",
          "nova_senha": "novaSenha123"
        }

    O que acontece por dentro:
      1. Busca o token na tabela password_reset_tokens.
      2. Valida se o token existe e ainda não expirou.
      3. Gera o hash da nova senha e salva no usuário.
      4. Apaga o token (uso único — ele não pode ser reutilizado).

    Respostas:
      200 → usuário atualizado (senha trocada).
      400 → token inválido ou expirado.
    """
    user = password_reset_token_service.reset_password(db, data.token, data.nova_senha)
    return user