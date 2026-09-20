from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import RoleEnum
from app.schemas.unidade_schema import UnidadeCreate, UnidadeUpdate, UnidadeResponse
from app.services import unidade_service

router = APIRouter(prefix="/unidades", tags=["Unidades"])

@router.get("/", response_model=list[UnidadeResponse])
def list_unidades(db: Session = Depends(get_db)):
    return unidade_service.get_unidades(db)

@router.post("/", response_model=UnidadeResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def create_unidade(data: UnidadeCreate, db: Session = Depends(get_db)):
    return unidade_service.create_unidade(db, data)

@router.get("/{unidade_id}", response_model=UnidadeResponse)
def get_unidade(unidade_id: int, db: Session = Depends(get_db)):
    return unidade_service.get_unidade(db, unidade_id)

@router.put("/{unidade_id}", response_model=UnidadeResponse,
            dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def update_unidade(unidade_id: int, data: UnidadeUpdate, db: Session = Depends(get_db)):
    return unidade_service.update_unidade(db, unidade_id, data)

@router.delete("/{unidade_id}", status_code=status.HTTP_204_NO_CONTENT,
              dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def delete_unidade(unidade_id: int, db: Session = Depends(get_db)):
    unidade_service.delete_unidade(db, unidade_id)