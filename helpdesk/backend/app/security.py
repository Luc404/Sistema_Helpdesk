# ============================================
# SEGURANÇA: HASH DE SENHA + TOKENS JWT
# ============================================
# Centraliza as funções de criptografia usadas por toda a aplicação:
#   - Hash de senha (passlib + bcrypt) para nunca guardar senhas em texto puro.
#   - Geração e validação de tokens JWT para autenticação.

from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

# Contexto de hashing. "bcrypt" é o algoritmo usado, "auto" permite evoluir
# para algoritmos mais seguros no futuro sem quebrar hashes antigos.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(senha: str) -> str:
    """Gera um hash seguro da senha antes de salvar no banco."""
    return pwd_context.hash(senha)


def verify_password(senha: str, senha_hash: str) -> bool:
    """Compara a senha digitada com o hash salvo no banco."""
    return pwd_context.verify(senha, senha_hash)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Cria um token JWT assinado contendo os dados informados (ex.: o id do usuário).
    O token expira após ACCESS_TOKEN_EXPIRE_MINUTES minutos.
    """
    to_encode = data.copy()
    # Define a data de expiração (usa o delta informado ou o padrão do settings).
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Valida e decodifica um token JWT.
    Retorna o payload (dados) do token ou None se ele for inválido/expirado.
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None