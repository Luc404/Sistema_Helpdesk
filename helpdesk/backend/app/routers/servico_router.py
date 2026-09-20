from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import RoleEnum
from app.schemas.servico_schema import ServicoCreate, ServicoUpdate, ServicoResponse
from app.services import servico_service

router = APIRouter(prefix="/servicos", tags=["Serviços"])

@router.get("/", response_model=list[ServicoResponse])
def list_servicos(db: Session = Depends(get_db)):
    return servico_service.get_servicos(db)

@router.post("/", response_model=ServicoResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def create_servico(data: ServicoCreate, db: Session = Depends(get_db)):
    return servico_service.create_servico(db, data)

@router.get("/{servico_id}", response_model=ServicoResponse)
def get_servico(servico_id: int, db: Session = Depends(get_db)):
    return servico_service.get_servico(db, servico_id)

@router.put("/{servico_id}", response_model=ServicoResponse,
            dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def update_servico(servico_id: int, data: ServicoUpdate, db: Session = Depends(get_db)):
    return servico_service.update_servico(db, servico_id, data)

@router.delete("/{servico_id}", status_code=status.HTTP_204_NO_CONTENT,
              dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def delete_servico(servico_id: int, db: Session = Depends(get_db)):
    servico_service.delete_servico(db, servico_id)