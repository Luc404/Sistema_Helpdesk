# ============================================
# ROUTER DE CONVIDADOS (endpoints /convidados)
# ============================================
# Grupo de rotas responsável pelos convites criados pelo ADMIN.
#
# Permissões:
#   - TODAS as rotas exigem papel ADMIN (a gestão de usuários saiu do
#     TÉCNICO e passou para o ADMIN). Sem isso -> 403.
#
# O consumidor real do convite é o cadastro público: em POST /auth/register,
# o backend lê o convite do e-mail, aplica o papel e o consome (veja
# app/routers/auth_router.py e app/services/convidado_service.py).

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import RoleEnum
from app.schemas.convidado_schema import (
    ConvidadoCreate,
    ConvidadoUpdate,
    ConvidadoResponse,
)
from app.services import convidado_service

router = APIRouter(prefix="/convidados", tags=["Convidados"])


# ----------------------------------------------------------
# ROTA: GET /convidados  ->  Listar convites
# ----------------------------------------------------------
@router.get("/", response_model=list[ConvidadoResponse],
            dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def list_convidados(db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Lista todos os convites pendentes.
    Acesso: somente ADMIN.

    Respostas:
      200 → lista de convites (array JSON).
      403 → quem chamou não é admin.
    """
    return convidado_service.get_convidados(db)


# ----------------------------------------------------------
# ROTA: POST /convidados  ->  Criar convite
# ----------------------------------------------------------
@router.post("/", response_model=ConvidadoResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def create_convidado(data: ConvidadoCreate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Convida um funcionário informando o e-mail e o papel.

    Body esperado (JSON):
        { "email": "joao@empresa.com", "role": "TECNICO" }

    O que acontece por dentro:
      1. Valida o body (e-mail válido e role sem ser ADMIN).
      2. Rejeita convite duplicado ou para e-mail que já tem conta (409).
      3. Quando o funcionário se cadastrar com este e-mail, o sistema
         aplica "role" automaticamente e consome o convite.

    Respostas:
      201 → convite criado.
      403 → quem chamou não é admin.
      409 → e-mail já convidado ou já cadastrado no sistema.
      422 → body inválido (e-mail mal formatado ou role igual a ADMIN).
    """
    return convidado_service.create_convidado(db, data)


# ----------------------------------------------------------
# ROTA: GET /convidados/{convidado_id}  ->  Detalhar convite
# ----------------------------------------------------------
@router.get("/{convidado_id}", response_model=ConvidadoResponse,
            dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def get_convidado(convidado_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Retorna um convite específico pelo id.
    Acesso: somente ADMIN.

    Respostas:
      200 → dados do convite.
      403 → quem chamou não é admin.
      404 → convite não encontrado.
    """
    return convidado_service.get_convidado(db, convidado_id)


# ----------------------------------------------------------
# ROTA: PUT /convidados/{convidado_id}  ->  Editar convite
# ----------------------------------------------------------
@router.put("/{convidado_id}", response_model=ConvidadoResponse,
            dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def update_convidado(convidado_id: int, data: ConvidadoUpdate,
                           db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Altera o papel de um convite (update parcial).
    Acesso: somente ADMIN.

    Body esperado (JSON):
        { "role": "USUARIO" }

    Respostas:
      200 → convite atualizado.
      403 → quem chamou não é admin, ou tentou definir role ADMIN.
      404 → convite não encontrado.
      422 → body sem nenhum campo válido.
    """
    return convidado_service.update_convidado(db, convidado_id, data)


# ----------------------------------------------------------
# ROTA: DELETE /convidados/{convidado_id}  ->  Remover convite
# ----------------------------------------------------------
@router.delete("/{convidado_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
async def delete_convidado(convidado_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Remove um convite do sistema.
    Acesso: somente ADMIN.

    Respostas:
      204 → removido com sucesso (sem corpo na resposta).
      403 → quem chamou não é admin.
      404 → convite não encontrado.
    """
    convidado_service.delete_convidado(db, convidado_id)