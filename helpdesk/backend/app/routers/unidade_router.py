# ============================================
# ROUTER DE UNIDADES (endpoints /unidades)
# ============================================
# Grupo de rotas responsável pelo CRUD de unidades (ex.: Matriz, Filial).
#
# Permissões:
#   - GET (listar/detalhar): acesso público.
#   - POST / PUT / DELETE: exigem papel TÉCNICO (senão -> 403).
#
# As docstrings de cada endpoint aparecem também no Swagger.

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import RoleEnum
from app.schemas.unidade_schema import UnidadeCreate, UnidadeUpdate, UnidadeResponse
from app.services import unidade_service

router = APIRouter(prefix="/unidades", tags=["Unidades"])


# ----------------------------------------------------------
# ROTA: GET /unidades  ->  Listar unidades
# ----------------------------------------------------------
@router.get("/", response_model=list[UnidadeResponse])
def list_unidades(db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Lista todas as unidades cadastradas.
    Acesso: público (o usuário precisa ver a própria unidade ao abrir chamado).

    Respostas:
      200 → lista de unidades (array JSON).
    """
    return unidade_service.get_unidades(db)


# ----------------------------------------------------------
# ROTA: POST /unidades  ->  Criar unidade
# ----------------------------------------------------------
@router.post("/", response_model=UnidadeResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def create_unidade(data: UnidadeCreate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Cadastra uma nova unidade.
    Acesso: somente TÉCNICO.

    Body esperado (JSON):
        { "nome": "Matriz" }

    Respostas:
      201 → unidade criada.
      403 → usuário não é técnico.
      409 → já existe unidade com esse nome (nome é único).
    """
    return unidade_service.create_unidade(db, data)


# ----------------------------------------------------------
# ROTA: GET /unidades/{unidade_id}  ->  Detalhar unidade
# ----------------------------------------------------------
@router.get("/{unidade_id}", response_model=UnidadeResponse)
def get_unidade(unidade_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Retorna uma unidade específica pelo id.
    Acesso: público.

    Parâmetro de URL:
      - unidade_id (int): id da unidade (ex.: /unidades/1).

    Respostas:
      200 → dados da unidade.
      404 → unidade não encontrada.
    """
    return unidade_service.get_unidade(db, unidade_id)


# ----------------------------------------------------------
# ROTA: PUT /unidades/{unidade_id}  ->  Editar unidade
# ----------------------------------------------------------
@router.put("/{unidade_id}", response_model=UnidadeResponse,
            dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def update_unidade(unidade_id: int, data: UnidadeUpdate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Edita uma unidade (update parcial).
    Acesso: somente TÉCNICO.

    Parâmetro de URL:
      - unidade_id (int): id da unidade a ser editada.

    Body esperado (JSON):
      Envie SOMENTE os campos que deseja alterar; campos vazios/nulos
      não sobrescrevem o valor atual.

    Respostas:
      200 → unidade atualizada.
      403 → usuário não é técnico.
      404 → unidade não encontrada.
      422 → body sem nenhum campo válido.
    """
    return unidade_service.update_unidade(db, unidade_id, data)


# ----------------------------------------------------------
# ROTA: DELETE /unidades/{unidade_id}  ->  Remover unidade
# ----------------------------------------------------------
@router.delete("/{unidade_id}", status_code=status.HTTP_204_NO_CONTENT,
              dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def delete_unidade(unidade_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Remove uma unidade do sistema.
    Acesso: somente TÉCNICO.

    Respostas:
      204 → removida com sucesso.
      403 → usuário não é técnico.
      404 → unidade não encontrada.
    """
    unidade_service.delete_unidade(db, unidade_id)