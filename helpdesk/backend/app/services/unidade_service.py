# ============================================
# SERVICE DE UNIDADE (regras de negócio)
# ============================================
# CRUD das unidades/setores da empresa (ex.: "Matriz", "Filial").
# A diferença para os demais services é a trava de nome duplicado,
# porque o model define "nome" com unique=True.
#
# A unidade "Matriz" é criada automaticamente na inicialização da API
# pelo seed (app/seed.py). Este service cuida das demais: filiais e
# setores cadastrados pelo perfil TÉCNICO.

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.unidade import Unidade
from app.schemas.unidade_schema import UnidadeCreate, UnidadeUpdate


def get_unidade(db: Session, unidade_id: int) -> Unidade:
    """Busca uma unidade pelo id; lança 404 se não existir."""
    # Busca pela chave primária. O "first()" devolve None quando não acha.
    unidade = db.query(Unidade).filter(Unidade.id == unidade_id).first()

    # 404 = recurso não existe. Differente de 403 (sem permissão).
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade Não Encontrada")

    return unidade


def get_unidades(db: Session) -> list[Unidade]:
    """Lista todas as unidades.

    Não há paginação nem filtro: a lista de unidades é pequena e precisa
    inteira para preencher o <select> do formulário de chamado.
    """
    return db.query(Unidade).all()


def create_unidade(db: Session, data: UnidadeCreate) -> Unidade:
    """Cria uma unidade; rejeita nome duplicado (409).

    A verificação é feita no código (e não só no banco) para devolver
    uma mensagem de erro compreensível em vez de um erro de SQL.
    """
    # unique=True no model já impediria a duplicata, mas o erro do banco
    # chegaria como 500. Checando antes, o usuário recebe um 400/409 claro.
    if db.query(Unidade).filter(Unidade.nome == data.nome).first():
        raise HTTPException(status_code=409, detail="Unidade já cadastrada")

    # Os campos vêm prontos e validados do schema UnidadeCreate.
    unidade = Unidade(nome=data.nome)

    # Sequência padrão do projeto: add -> commit -> refresh.
    db.add(unidade)
    db.commit()
    db.refresh(unidade)  # Recarrega para trazer o id gerado pelo banco
    return unidade


def update_unidade(db: Session, unidade_id: int, data: UnidadeUpdate) -> Unidade:
    """Edita apenas os campos realmente enviados (update parcial).

    Campos não enviados ou vazios mantêm o valor atual.

    Como funciona o update parcial:
      - "exclude_unset=True" ignora os campos que o cliente NÃO enviou;
      - o filtro "is not None" descarta nulos e strings vazias.
    Assim, um PUT com só {"nome": "..."} não apaga nada além do nome.
    """
    # 404 sai daqui se a unidade não existir.
    unidade = get_unidade(db, unidade_id)

    # Só os campos realmente enviados entram na troca.
    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}

    # Aplica cada campo alterado no objeto do ORM.
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
    # 404 sai daqui se a unidade não existir.
    unidade = get_unidade(db, unidade_id)

    db.delete(unidade)
    db.commit()
