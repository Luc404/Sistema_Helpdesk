# ============================================
# SERVICE DE SETOR (regras de negócio)
# ============================================
# CRUD dos setores/departamentos da empresa (ex.: Financeiro, RH).
# A única regra especial é a trava de nome duplicado, porque o model
# define "nome" com unique=True.

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.setor import Setor
from app.schemas.setor_schema import SetorCreate, SetorUpdate


def get_setor(db: Session, setor_id: int) -> Setor:
    """Busca um setor pelo id; lança 404 se não existir."""
    setor = db.query(Setor).filter(Setor.id == setor_id).first()

    if not setor:
        raise HTTPException(status_code=404, detail="Setor Não Encontrado")

    return setor


def get_setores(db: Session) -> list[Setor]:
    """Lista todos os setores.

    Não há paginação nem filtro: a lista é pequena e precisa inteira para
    preencher o <select> do cadastro de usuário.
    """
    return db.query(Setor).all()


def create_setor(db: Session, data: SetorCreate) -> Setor:
    """Cria um setor; rejeita nome duplicado (409)."""
    # unique=True no model já impediria a duplicata, mas o erro do banco
    # chegaria como 500. Checando antes, a mensagem fica clara.
    if db.query(Setor).filter(Setor.nome == data.nome).first():
        raise HTTPException(status_code=409, detail="Setor já cadastrado")

    setor = Setor(nome=data.nome)

    # Sequência padrão do projeto: add -> commit -> refresh.
    db.add(setor)
    db.commit()
    db.refresh(setor)
    return setor


def update_setor(db: Session, setor_id: int, data: SetorUpdate) -> Setor:
    """Edita apenas os campos realmente enviados (update parcial)."""
    # 404 sai daqui se o setor não existir.
    setor = get_setor(db, setor_id)

    # Só os campos realmente enviados entram na troca.
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}

    # Aplica cada campo alterado no objeto do ORM.
    for key, value in updates.items():
        setattr(setor, key, value)

    db.commit()
    db.refresh(setor)
    return setor


def delete_setor(db: Session, setor_id: int) -> None:
    """Remove um setor do banco.

    Atenção: se houver usuários vinculados, o banco pode recusar a remoção
    por causa da chave estrangeira.
    """
    # 404 sai daqui se o setor não existir.
    setor = get_setor(db, setor_id)

    db.delete(setor)
    db.commit()
