# ============================================
# SERVICE DE SERVIÇO (regras de negócio)
# ============================================
# CRUD dos serviços oferecidos pela empresa (ex.: "Treinamento Básico").
# Os routers só chamam estas funções; o acesso direto ao banco fica
# concentrado aqui, o que facilita manter as regras em um único lugar.

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.servico import Servico
from app.schemas.servico_schema import ServicoCreate, ServicoUpdate


def get_servico(db: Session, servico_id: int) -> Servico:
    """Busca um serviço pelo id; lança 404 se não existir."""
    servico = db.query(Servico).filter(Servico.id == servico_id).first()
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço Não Encontrado")
    return servico


def get_servicos(db: Session) -> list[Servico]:
    """Lista todos os serviços."""
    return db.query(Servico).all()


def create_servico(db: Session, data: ServicoCreate) -> Servico:
    """Cria um novo serviço.

    Os campos vêm prontos e validados do schema ServicoCreate.
    """
    servico = Servico(nome=data.nome, descricao=data.descricao, icone=data.icone)
    db.add(servico)   # Deixa o objeto pronto para gravação...
    db.commit()       # ...e confirma a transação de verdade
    db.refresh(servico)  # Recarrega do banco para trazer o id gerado
    return servico


def update_servico(db: Session, servico_id: int, data: ServicoUpdate) -> Servico:
    """Edita apenas os campos realmente enviados (update parcial).

    - "exclude_unset=True" ignora os campos que o cliente NÃO enviou.
    - O filtro "is not None" descarta nulos e strings vazias.
    Assim, um PUT com só {"nome": "..."} não apaga a descrição atual.
    """
    servico = get_servico(db, servico_id)
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    for key, value in updates.items():
        setattr(servico, key, value)
    db.commit()
    db.refresh(servico)
    return servico


def delete_servico(db: Session, servico_id: int) -> None:
    """Remove um serviço do banco.

    Lança 404 se o id não existir (via get_servico).
    """
    servico = get_servico(db, servico_id)
    db.delete(servico)
    db.commit()
