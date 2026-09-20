# ============================================
# ROUTER DE SERVIÇOS (endpoints /servicos)
# ============================================
# Grupo de rotas responsável pelo CRUD de serviços (ex.: Treinamento Básico).
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
from app.schemas.servico_schema import ServicoCreate, ServicoUpdate, ServicoResponse
from app.services import servico_service

router = APIRouter(prefix="/servicos", tags=["Serviços"])


# ----------------------------------------------------------
# ROTA: GET /servicos  ->  Listar serviços
# ----------------------------------------------------------
@router.get("/", response_model=list[ServicoResponse])
def list_servicos(db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Lista todos os serviços cadastrados.
    Acesso: público (qualquer um pode listar os serviços para abrir chamado).

    Respostas:
      200 → lista de serviços (array JSON), pode estar vazia.
    """
    return servico_service.get_servicos(db)


# ----------------------------------------------------------
# ROTA: POST /servicos  ->  Criar serviço
# ----------------------------------------------------------
@router.post("/", response_model=ServicoResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def create_servico(data: ServicoCreate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Cadastra um novo serviço disponível para chamados.
    Acesso: somente TÉCNICO.

    Body esperado (JSON):
        {
          "nome": "Treinamento Básico",
          "descricao": "Treinamento de uso do sistema",
          "icone": "bi-easel"          // opcional
        }

    Respostas:
      201 → serviço criado.
      403 → usuário logado não é técnico.
    """
    return servico_service.create_servico(db, data)


# ----------------------------------------------------------
# ROTA: GET /servicos/{servico_id}  ->  Detalhar serviço
# ----------------------------------------------------------
@router.get("/{servico_id}", response_model=ServicoResponse)
def get_servico(servico_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Retorna um serviço específico pelo id.
    Acesso: público.

    Parâmetro de URL:
      - servico_id (int): id do serviço (ex.: /servicos/1).

    Respostas:
      200 → dados do serviço.
      404 → serviço não encontrado.
    """
    return servico_service.get_servico(db, servico_id)


# ----------------------------------------------------------
# ROTA: PUT /servicos/{servico_id}  ->  Editar serviço
# ----------------------------------------------------------
@router.put("/{servico_id}", response_model=ServicoResponse,
            dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def update_servico(servico_id: int, data: ServicoUpdate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Edita um serviço (update parcial).
    Acesso: somente TÉCNICO.

    Parâmetro de URL:
      - servico_id (int): id do serviço a ser editado.

    Body esperado (JSON):
      Envie SOMENTE os campos que deseja alterar; campos vazios/nulos
      não sobrescrevem o valor atual.

    Respostas:
      200 → serviço atualizado.
      403 → usuário não é técnico.
      404 → serviço não encontrado.
      422 → body sem nenhum campo válido.
    """
    return servico_service.update_servico(db, servico_id, data)


# ----------------------------------------------------------
# ROTA: DELETE /servicos/{servico_id}  ->  Remover serviço
# ----------------------------------------------------------
@router.delete("/{servico_id}", status_code=status.HTTP_204_NO_CONTENT,
              dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
def delete_servico(servico_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Remove um serviço do sistema.
    Acesso: somente TÉCNICO.

    Respostas:
      204 → removido com sucesso.
      403 → usuário não é técnico.
      404 → serviço não encontrado.
    """
    servico_service.delete_servico(db, servico_id)