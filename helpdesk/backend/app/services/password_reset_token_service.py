# ============================================
# SERVICE DE REDEFINIÇÃO DE SENHA
# ============================================
# Gera tokens para o fluxo "esqueci minha senha" e valida esses tokens
# na hora de efetivar a troca da senha.

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.password_reset_token import PasswordResetToken
from app.models.user import StatusEnum, User


def create_reset_token(db: Session, email: str) -> str:
    """Gera um token aleatório e salva no banco com validade de 2 horas.

    - Retorna o token em texto (para o frontend mostrar/enviar).
    - 404 se o e-mail não existir ou a conta estiver inativa.
    """
    user = db.query(User).filter(User.email == email, User.status == StatusEnum.ATIVO).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # secrets.token_urlsafe gera um token aleatório e criptograficamente
    # seguro (diferente de um uuid comum, que é previsível).
    token = secrets.token_urlsafe(32)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        # Validade de 2 horas a partir de agora.
        expira_em=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    db.add(reset_token)
    db.commit()
    return token


def reset_password(db: Session, token: str, nova_senha: str) -> User:
    """Efetiva a troca de senha usando o token.

    - Tokens inválidos ou expirados geram erro (400).
    - Após o uso, o token é apagado (não pode ser reutilizado).
    """
    # Import local (e não no topo do arquivo) para evitar dependência
    # circular entre o service e o módulo de segurança.
    from app.security import hash_password

    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Token inválido")

    # Compara a validade do token com o horário atual (expira_em).
    if reset_token.expira_em.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        # Apaga o token expirado para não acumular lixo no banco.
        db.delete(reset_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Token expirado")

    user = db.query(User).filter(User.id == reset_token.user_id).first()

    # Grava a nova senha (hasheada) e invalida o token na mesma transação.
    user.senha = hash_password(nova_senha)
    db.delete(reset_token)  # Token de uso único
    db.commit()
    db.refresh(user)
    return user
