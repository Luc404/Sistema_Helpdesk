# ============================================
# DEPENDÊNCIAS DE AUTENTICAÇÃO E AUTORIZAÇÃO
# ============================================
# Fornece as dependências do FastAPI responsáveis por:
#   - Descobrir quem é o usuário logado (via token JWT no header Authorization).
#   - Restringir acesso a determinados papéis (ex.: somente TÉCNICO).

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RoleEnum, StatusEnum
from app.security import decode_access_token

# Esquema HTTP Bearer: o cliente envia o token no header "Authorization: Bearer <token>".
# auto_error=False para tratarmos o erro manualmente (retornando 401 com mensagem própria).
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependência que retorna o usuário autenticado.
    Usada nos routers como: current_user: User = Depends(get_current_user).
    Lança 401 se não houver token válido ou se o usuário estiver inativo.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Se não veio nenhum token, nega o acesso.
    if credentials is None:
        raise credentials_exception

    # Decodifica o token e extrai o id do usuário (campo "sub").
    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise credentials_exception

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise credentials_exception

    # Busca o usuário no banco e verifica se está ativo.
    user = db.query(User).filter(User.id == user_id, User.status == StatusEnum.ATIVO).first()
    if user is None:
        raise credentials_exception
    return user


def require_roles(*roles: RoleEnum):
    """
    Fábrica de dependência que restringe uma rota aos papéis informados.

    Exemplo de uso:
        dependencies=[Depends(require_roles(RoleEnum.TECNICO))]

    Retorna 403 se o usuário logado não tiver o papel exigido.
    """
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para executar esta ação",
            )
        return current_user
    return checker