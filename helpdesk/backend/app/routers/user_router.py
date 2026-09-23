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

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user_schema import UserCreate, UserUpdate, UserResponse
from app.services import user_service

# Prefixo de todas as rotas deste arquivo + tag exibida no Swagger.
router = APIRouter(prefix="/users", tags=["Usuário"])


# ----------------------------------------------------------
# ROTA: POST /users  ->  Criar usuário
# ----------------------------------------------------------
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create(user: UserCreate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Cadastra um novo usuário no sistema.

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

    Respostas:
      201 → usuário criado (retorna os dados sem a senha).
      409 → e-mail já cadastrado.

    Obs.: o cadastro também pode ser feito em POST /auth/register.
    """
    return user_service.create_user(db, user)


# ----------------------------------------------------------
# ROTA: GET /users  ->  Listar usuários
# ----------------------------------------------------------
@router.get("/", response_model=list[UserResponse])
async def list_users(db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Lista todos os usuários cadastrados.

    O que acontece por dentro:
      - Chama user_service.get_users, que busca todas as linhas da tabela
        "users" e devolve uma lista (pode estar vazia).

    Respostas:
      200 → lista de usuários (array JSON).
    """
    return user_service.get_users(db)


# ----------------------------------------------------------
# ROTA: GET /users/{user_id}  ->  Detalhar usuário
# ----------------------------------------------------------
@router.get("/{user_id}", response_model=UserResponse)
async def get_users(user_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Retorna os dados de um usuário específico.

    Parâmetro de URL:
      - user_id (int): id do usuário desejado (ex.: /users/1).

    O que acontece por dentro:
      - user_service.get_user busca a linha pelo id.

    Respostas:
      200 → dados do usuário.
      404 → usuário não encontrado.
    """
    return user_service.get_user(db, user_id)


# ----------------------------------------------------------
# ROTA: PUT /users/{user_id}  ->  Editar usuário
# ----------------------------------------------------------
@router.put("/{user_id}", response_model=UserResponse)
async def update(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Edita os dados de um usuário.

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

    Respostas:
      200 → usuário atualizado.
      404 → usuário não encontrado.
      422 → body sem nenhum campo válido.
    """
    return user_service.update_user(db, user_id, user)


# ----------------------------------------------------------
# ROTA: DELETE /users/{user_id}  ->  Remover usuário
# ----------------------------------------------------------
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(user_id: int, db: Session = Depends(get_db)):
    """
    FUNCIONALIDADE: Remove um usuário do sistema (exclusão definitiva).

    Parâmetro de URL:
      - user_id (int): id do usuário a ser removido.

    Respostas:
      204 → removido com sucesso (sem corpo na resposta).
      404 → usuário não encontrado.
    """
    user_service.delete_user(db, user_id)