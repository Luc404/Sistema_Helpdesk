from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.servico import Servico
from app.schemas.servico_schema import ServicoCreate, ServicoUpdate

def get_servico(db: Session, servico_id: int) -> Servico:
    servico = db.query(Servico).filter(Servico.id == servico_id).first()
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço Não Encontrado")
    return servico

def get_servicos(db: Session) -> list[Servico]:
    return db.query(Servico).all()

def create_servico(db: Session, data: ServicoCreate) -> Servico:
    servico = Servico(nome=data.nome, descricao=data.descricao, icone=data.icone)
    db.add(servico)
    db.commit()
    db.refresh(servico)
    return servico

def update_servico(db: Session, servico_id: int, data: ServicoUpdate) -> Servico:
    servico = get_servico(db, servico_id)
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    for key, value in updates.items():
        setattr(servico, key, value)
    db.commit()
    db.refresh(servico)
    return servico

def delete_servico(db: Session, servico_id: int) -> None:
    servico = get_servico(db, servico_id)
    db.delete(servico)
    db.commit()