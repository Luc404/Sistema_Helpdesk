from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserUpdate

def create_user(db: Session, user_data: UserCreate) -> User:
    new_user = User(
        nome=user_data.nome,
        email=user_data.email,
        senha_hash=user_data.senha_hash
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def get_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário Não Encontrado")
    return user

def get_users(db: Session) -> list[User]:
    return db.query(User).all()

def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
    user = get_user(db, user_id)
    updates = user_data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> None:
    user = get_user(db, user_id)
    db.delete(user)
    db.commit()