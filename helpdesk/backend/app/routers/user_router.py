from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user_schema import UserCreate, UserUpdate, UserResponse
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Usuários"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return user_service.get_users(db)

@router.get("/{user_id}", response_model=UserResponse)
def get_users(user_id: int, db: Session = Depends(get_db)):
    return user_service.get_user(db, user_id)

@router.put("/{user_id}", response_model=UserResponse)
def update(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    return user_service.update_user(db, user_id, user)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(user_id: int, db: Session = Depends(get_db)):
    user_service.delete_user(db, user_id)