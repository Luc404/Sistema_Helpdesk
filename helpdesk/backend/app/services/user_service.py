from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, StatusEnum
from app.schemas.user_schema import UserCreate, UserUpdate
from app.security import hash_password, verify_password

def create_user(db: Session, user_data: UserCreate, role=None) -> User:
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")

    new_user = User(
        nome=user_data.nome,
        email=user_data.email,
        senha=hash_password(user_data.senha),
        data_nascimento=user_data.data_nascimento,
        unidade_id=user_data.unidade_id,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, senha: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(senha, user.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status != StatusEnum.ATIVO:
        raise HTTPException(status_code=403, detail="Usuário inativo")
    return user

def get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário Não Encontrado")
    return user

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session) -> list[User]:
    return db.query(User).all()

def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
    user = get_user(db, user_id)
    updates = {k: v for k, v in user_data.model_dump(exclude_unset=True).items() if v is not None}
    if "senha" in updates:
        updates["senha"] = hash_password(updates["senha"])
    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> None:
    user = get_user(db, user_id)
    db.delete(user)
    db.commit()