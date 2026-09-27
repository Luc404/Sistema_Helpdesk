# ============================================
# SERVICE DE UNIDADE (regras de negócio)
# ============================================
# CRUD das unidades/setores da empresa (ex.: "Matriz", "Filial").
# A diferença para os demais services é a trava de nome duplicado,
# porque o model define "nome" com unique=True.

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.unidade import Unidade
from app.schemas.unidade_schema import UnidadeCreate, UnidadeUpdate


def get_unidade(db: Session, unidade_id: int) -> Unidade:
    """Busca uma unidade pelo id; lança 404 se não existir."""
    unidade = db.query(Unidade).filter(Unidade.id == unidade_id).first()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade Não Encontrada")
    return unidade


def get_unidades(db: Session) -> list[Unidade]:
    """Lista todas as unidades."""
    return db.query(Unidade).all()


def create_unidade(db: Session, data: UnidadeCreate) -> Unidade:
    """Cria uma unidade; rejeita nome duplicado (409).

    A verificação é feita no código (e não só no banco) para devolver
    uma mensagem de erro compreensível em vez de um erro de SQL.
    """
    if db.query(Unidade).filter(Unidade.nome == data.nome).first():
        raise HTTPException(status_code=409, detail="Unidade já cadastrada")
    unidade = Unidade(nome=data.nome)
    db.add(unidade)
    db.commit()
    db.refresh(unidade)
    return unidade


def update_unidade(db: Session, unidade_id: int, data: UnidadeUpdate) -> Unidade:
    """Edita apenas os campos realmente enviados (update parcial).

    Campos não enviados ou vazios mantêm o valor atual.
    """
    unidade = get_unidade(db, unidade_id)
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    for key, value in updates.items():
        setattr(unidade, key, value)
    db.commit()
    db.refresh(unidade)
    return unidade


def delete_unidade(db: Session, unidade_id: int) -> None:
    """Remove uma unidade do banco.

    Atenção: se houver usuários ou chamados vinculados, o banco pode
    recusar a remoção por causa da chave estrangeira.
    """
    unidade = get_unidade(db, unidade_id)
    db.delete(unidade)
    db.commit()
