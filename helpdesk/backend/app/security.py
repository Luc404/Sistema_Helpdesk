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
    """Gera um hash seguro da senha antes de salvar no banco.

    O bcrypt gera um hash DIFERENTE a cada chamada (inclui um "salt"
    aleatório). Por isso dois usuários com a mesma senha têm hashes
    diferentes, e a comparação só é possível com verify_password.
    """
    return pwd_context.hash(senha)


def verify_password(senha: str, senha_hash: str) -> bool:
    """Compara a senha digitada com o hash salvo no banco.

    (parametro) senha: senha em texto puro, exatamente como o usuário digitou.
    (parametro) senha_hash: hash guardado na coluna User.senha.
    (retorno): True quando batem, False caso contrário.
    """
    return pwd_context.verify(senha, senha_hash)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Cria um token JWT assinado contendo os dados informados (ex.: o id do usuário).
    O token expira após ACCESS_TOKEN_EXPIRE_MINUTES minutos.

    (parametro) data: conteúdo do token. O campo "sub" guarda o id do
                      usuário e é lido de volta em dependencies.get_current_user.
    (parametro) expires_delta: validade customizada. Se não for informada,
                               vale ACCESS_TOKEN_EXPIRE_MINUTES do config.
    (retorno): o token como string, para ir no header "Authorization: Bearer ...".
    """
    # Copia o dicionário recebido para não alterar o objeto do chamador.
    to_encode = data.copy()

    # Define a data de expiração (usa o delta informado ou o padrão do settings).
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # "exp" é um campo reservado do JWT: a biblioteca recusa tokens já vencidos
    # ao decodificar, o que implementa a expiração sem precisar de tabela no banco.
    to_encode.update({"exp": expire})

    # Assina o token com a SECRET_KEY. Sem essa assinatura, qualquer pessoa
    # conseguiria forjar um "sub" com o id de outra pessoa.
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Valida e decodifica um token JWT.

    (parametro) token: string recebida no header Authorization.
    (retorno): o payload (dados) do token, ou None se ele for inválido,
               estiver vencido ou tiver assinatura errada.
    """
    try:
        # A decodificação JÁ valida a assinatura e a expiração: um token
        # adulterado ou vencido levanta JWTError aqui dentro.
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        # Retorna None em vez de levantar exceção: quem chama (dependencies.py)
        # decide se isso vira um 401, sem precisar de try/except em cada rota.
        return None