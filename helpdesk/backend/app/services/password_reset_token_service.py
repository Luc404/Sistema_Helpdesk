import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.password_reset_token import PasswordResetToken
from app.models.user import StatusEnum, User

def create_reset_token(db: Session, email: str) -> str:
    user = db.query(User).filter(User.email == email, User.status == StatusEnum.ATIVO).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expira_em=datetime.now(timezone.utc) + timedelta(hours=2),
    )
    db.add(reset_token)
    db.commit()
    return token

def reset_password(db: Session, token: str, nova_senha: str) -> User:
    from app.security import hash_password

    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Token inválido")

    if reset_token.expira_em.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        db.delete(reset_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Token expirado")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    user.senha = hash_password(nova_senha)
    db.delete(reset_token)
    db.commit()
    db.refresh(user)
    return user