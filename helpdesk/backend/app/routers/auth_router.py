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

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = user_service.authenticate_user(db, data.email, data.senha)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=user)

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    token = password_reset_token_service.create_reset_token(db, data.email)
    return {"mensagem": "Token de redefinição gerado", "token": token}

@router.post("/reset-password", response_model=UserResponse)
def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = password_reset_token_service.reset_password(db, data.token, data.nova_senha)
    return user