# ============================================
# ROUTER DE USUÁRIOS (endpoints /users)
# ============================================
# Grupo de rotas responsável pelo CRUD de usuários.
#
# Como as rotas funcionam:
#   - O prefixo "/users" é aplicado em todas as rotas deste arquivo.
#   - Cada função abaixo é um endpoint HTTP (a tag @router.<método> define
#     a URL, o response_model e o código de status).
#   - As docstrings de cada endpoint aparecem também na documentação do Swagger.
#
# Permissões (importante para segurança):
#   - Antes estas rotas eram públicas. Isso permitia que QUALQUER pessoa,
#     sem token, chamasse PUT /users/1 com {"role": "TECNICO"} e se
#     promovesse sozinha a técnico. Agora todas exigem autenticação.
#   - POST e DELETE: somente TÉCNICO.
#   - PUT: o próprio usuário edita os dados pessoais; status e role
#     só podem ser alterados por um TÉCNICO.

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum
from app.schemas.user_schema import UserCreate, UserUpdate, UserResponse
from app.services import user_service

# Prefixo de todas as rotas deste arquivo + tag exibida no Swagger.
router = APIRouter(prefix="/users", tags=["Usuário"])

# Campos que só um TÉCNICO pode alterar em outro usuário.
# Sem essa trava, qualquer usuário logado poderia se promover a TÉCNICO
# chamando PUT /users/{seu_id} com {"role": "TECNICO"}.
CAMPOS_EXCLUSIVOS_DO_TECNICO = {"role", "status"}


# ----------------------------------------------------------
# ROTA: POST /users  ->  Criar usuário
# ----------------------------------------------------------
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
async def create(user: UserCreate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Cadastra um novo usuário no sistema.
    Acesso: somente TÉCNICO (antes era público).

    Body esperado (JSON):
        {
          "nome": "Lucas",
          "email": "lucas@teste.com",
          "senha": "123456",
          "data_nascimento": "1995-01-01",   // opcional
          "unidade_id": 1                    // opcional
        }

    O que acontece por dentro:
      1. O service (create_user) verifica se o e-mail já existe.
      2. A senha é hasheada (bcrypt) — nunca é salva em texto puro.
      3. O usuário é salvo na tabela "users" com role padrão USUARIO.
         (Use PUT /users/{id} para promover a TÉCNICO.)

    Respostas:
      201 → usuário criado (retorna os dados sem a senha).
      403 → quem chamou não é técnico.
      409 → e-mail já cadastrado.

    Obs.: o cadastro público continua disponível em POST /auth/register.
    """
    return user_service.create_user(db, user)


# ----------------------------------------------------------
# ROTA: GET /users  ->  Listar usuários
# ----------------------------------------------------------
@router.get("/", response_model=list[UserResponse],
            dependencies=[Depends(get_current_user)])
async def list_users(db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Lista todos os usuários cadastrados.
    Acesso: qualquer usuário logado (antes era público).

    O frontend usa esta rota para montar a lista de "usuários em cópia"
    e para resolver id -> nome nas telas de chamado.

    Respostas:
      200 → lista de usuários (array JSON).
      401 → não autenticado.
    """
    return user_service.get_users(db)


# ----------------------------------------------------------
# ROTA: GET /users/{user_id}  ->  Detalhar usuário
# ----------------------------------------------------------
@router.get("/{user_id}", response_model=UserResponse,
            dependencies=[Depends(get_current_user)])
async def get_users(user_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Retorna os dados de um usuário específico.
    Acesso: qualquer usuário logado (antes era público).

    Parâmetro de URL:
      - user_id (int): id do usuário desejado (ex.: /users/1).

    Respostas:
      200 → dados do usuário.
      401 → não autenticado.
      404 → usuário não encontrado.
    """
    return user_service.get_user(db, user_id)


# ----------------------------------------------------------
# ROTA: PUT /users/{user_id}  ->  Editar usuário
# ----------------------------------------------------------
@router.put("/{user_id}", response_model=UserResponse)
async def update(user_id: int, user: UserUpdate, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    """
    FUNCIONALIDADE: Edita os dados de um usuário.
    Acesso: o próprio usuário (dados pessoais) ou um TÉCNICO (tudo).

    Parâmetro de URL:
      - user_id (int): id do usuário a ser editado.

    Body esperado (JSON) — UPDATE PARCIAL:
      Envie SOMENTE os campos que deseja alterar:
        { "nome": "Lucas A" }
      Caso queira mudar a senha, envie "senha" (será hasheada).

    Regras importantes:
      - Campos vazios ("") ou null NÃO sobrescrevem o valor atual.
      - Se o body vier totalmente vazio {} -> erro 422
        ("Envie ao menos um campo para editar").
      - "role" e "status" SÓ são aceitos quando quem chama é TÉCNICO.
        Sem isso, um usuário comum poderia se auto-promover.

    Respostas:
      200 → usuário atualizado.
      401 → não autenticado.
      403 → tentou alterar "role"/"status" sem ser técnico.
      404 → usuário não encontrado.
      422 → body sem nenhum campo válido.
    """
    # Sem esta linha, qualquer pessoa trocaria o id e editaria o cadastro alheio.
    if current_user.id != user_id and current_user.role != RoleEnum.TECNICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode editar o próprio usuário",
        )

    # Trava de privilégio: "role" e "status" são recusados (403) quando quem
    # chama não é técnico. Sem isso, um usuário comum poderia se auto-promover
    # com PUT /users/{seu_id} e {"role": "TECNICO"}.
    if current_user.role != RoleEnum.TECNICO:
        enviados = user.model_dump(exclude_unset=True)
        indevidos = CAMPOS_EXCLUSIVOS_DO_TECNICO & enviados.keys()

        if indevidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Apenas técnicos podem alterar: {', '.join(sorted(indevidos))}",
            )

    return user_service.update_user(db, user_id, user)


# ----------------------------------------------------------
# ROTA: DELETE /users/{user_id}  ->  Remover usuário
# ----------------------------------------------------------
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(RoleEnum.TECNICO))])
async def delete(user_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Remove um usuário do sistema (exclusão definitiva).
    Acesso: somente TÉCNICO (antes era público — qualquer um podia apagar contas).

    Parâmetro de URL:
      - user_id (int): id do usuário a ser removido.

    Respostas:
      204 → removido com sucesso (sem corpo na resposta).
      403 → quem chamou não é técnico.
      404 → usuário não encontrado.
    """
    user_service.delete_user(db, user_id)