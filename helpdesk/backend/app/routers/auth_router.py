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
from app.schemas.password_reset_token_schema import (
    PasswordResetRequest,
    PasswordResetResponse,
    PasswordResetConfirm,
    PasswordResetTokenStatus,
)
from app.services import user_service, password_reset_token_service

router = APIRouter(prefix="/auth", tags=["Autenticação"])


# ----------------------------------------------------------
# ROTA: POST /auth/register  ->  Cadastro de usuário
# ----------------------------------------------------------
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
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
async def login(data: UserLogin, db: Session = Depends(get_db)):
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
async def me(current_user: User = Depends(get_current_user)):
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
@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Gera um token para redefinir a senha de um usuário (1ª etapa).

    Body esperado (JSON):
        { "email": "lucas@teste.com" }

    O que acontece por dentro:
      1. Apaga da tabela os tokens que já venceram (faxina).
      2. Procura um usuário ATIVO com esse e-mail.
      3. Se encontrar, revoga os tokens anteriores dele e cria um novo,
         válido por PASSWORD_RESET_EXPIRE_MINUTES minutos (padrão: 120).
      4. Devolve o link de redefinição para o frontend exibir.

    SEGURANÇA (anti-enumeração de contas):
      A resposta é SEMPRE 200 com a mesma mensagem, exista o e-mail ou não.
      Antes, esta rota devolvia 404 para e-mails desconhecidos, o que
      permitia a um atacante descobrir quais contas estão cadastradas
      comparando 200 x 404. O campo "token" vem null nesse caso.

    Respostas:
      200 → { mensagem, token, link } (token/link só existem se a conta existir).
      422 → e-mail mal formatado.
    """
    return password_reset_token_service.create_reset_token(db, data.email)


# ----------------------------------------------------------
# ROTA: GET /auth/reset-password/validar  ->  Conferir o token
# ----------------------------------------------------------
# ATENÇÃO À ORDEM: esta rota é declarada ANTES de qualquer rota com
# caminho variável em "/reset-password/...", senão o FastAPI tentaria
# interpretar "validar" como parâmetro.
@router.get("/reset-password/validar", response_model=PasswordResetTokenStatus)
async def validar_token_reset(token: str, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Informa se o token de redefinição ainda é válido.

    Serve para a tela /redefinir-senha avisar o usuário assim que ela abre
    (link vencido, já utilizado, nunca existiu), em vez de só descobrir
    o problema depois de ele digitar a senha nova.

    Query esperado (? na URL):
        ?token=abc123

    O que acontece por dentro:
      - Busca o token na tabela password_reset_tokens.
      - Confere se ele existe e se ainda não venceu o prazo.
      - NÃO apaga nada e NÃO exige login.

    Respostas:
      200 → { valido: true }  ou  { valido: false, mensagem: "..." }.
             Nunca devolve erro, nem para token inválido.
    """
    return password_reset_token_service.obter_situacao_token(db, token)


# ----------------------------------------------------------
# ROTA: POST /auth/reset-password  ->  Efetivar redefinição
# ----------------------------------------------------------
@router.post("/reset-password", response_model=UserResponse)
async def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Troca a senha usando o token recebido (2ª etapa).

    Body esperado (JSON):
        {
          "token": "token-gerado-no-forgot-password",
          "nova_senha": "novaSenha123"
        }

    O que acontece por dentro:
      1. Valida a força da senha nova (mínimo de SENHA_MINIMO_CARACTERES).
      2. Busca o token na tabela password_reset_tokens.
      3. Valida se o token existe e ainda não expirou.
      4. Gera o hash da nova senha e salva no usuário.
      5. Apaga o token (uso único — ele não pode ser reutilizado).

    Respostas:
      200 → usuário atualizado (senha trocada).
      400 → token inválido, expirado ou já utilizado.
      422 → senha em branco ou curta demais.
    """
    user = password_reset_token_service.reset_password(db, data.token, data.nova_senha)
    return user