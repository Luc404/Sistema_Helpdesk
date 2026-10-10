# ============================================
# ROUTER DE SETORES (endpoints /setores)
# ============================================
# Grupo de rotas responsável pelo CRUD dos setores/departamentos.
#
# Permissões (mesmo padrão de /unidades e /servicos):
#   - GET (listar/detalhar): acesso público (o cadastro público precisa
#     carregar a lista de setores antes de o usuário estar logado).
#   - POST / PUT / DELETE: exigem papel ADMIN (senão -> 403).

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import RoleEnum
from app.schemas.setor_schema import SetorCreate, SetorUpdate, SetorResponse
from app.services import setor_service

router = APIRouter(prefix="/setores", tags=["Setores"])


# ----------------------------------------------------------
# ROTA: GET /setores  ->  Listar setores
# ----------------------------------------------------------
@router.get("/", response_model=list[SetorResponse])
async def list_setores(db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Lista todos os setores cadastrados.
    Acesso: público (o cadastro de usuário precisa da lista).

    Respostas:
      200 → lista de setores (array JSON).
    """
    return setor_service.get_setores(db)


# ----------------------------------------------------------
# ROTA: POST /setores  ->  Criar setor
# ----------------------------------------------------------
@router.post("/", response_model=SetorResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def create_setor(data: SetorCreate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Cadastra um novo setor.
    Acesso: somente ADMIN.

    Body esperado (JSON):
        { "nome": "Financeiro" }

    Respostas:
      201 → setor criado.
      403 → usuário não é admin.
      409 → já existe setor com esse nome (nome é único).
    """
    return setor_service.create_setor(db, data)


# ----------------------------------------------------------
# ROTA: GET /setores/{setor_id}  ->  Detalhar setor
# ----------------------------------------------------------
@router.get("/{setor_id}", response_model=SetorResponse)
async def get_setor(setor_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Retorna um setor específico pelo id.
    Acesso: público.

    Respostas:
      200 → dados do setor.
      404 → setor não encontrado.
    """
    return setor_service.get_setor(db, setor_id)


# ----------------------------------------------------------
# ROTA: PUT /setores/{setor_id}  ->  Editar setor
# ----------------------------------------------------------
@router.put("/{setor_id}", response_model=SetorResponse,
            dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def update_setor(setor_id: int, data: SetorUpdate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Edita um setor (update parcial).
    Acesso: somente ADMIN.

    Respostas:
      200 → setor atualizado.
      403 → usuário não é admin.
      404 → setor não encontrado.
      422 → body sem nenhum campo válido.
    """
    return setor_service.update_setor(db, setor_id, data)


# ----------------------------------------------------------
# ROTA: DELETE /setores/{setor_id}  ->  Remover setor
# ----------------------------------------------------------
@router.delete("/{setor_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def delete_setor(setor_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Remove um setor do sistema.
    Acesso: somente ADMIN.

    Respostas:
      204 → removido com sucesso.
      403 → usuário não é admin.
      404 → setor não encontrado.
    """
    setor_service.delete_setor(db, setor_id)
