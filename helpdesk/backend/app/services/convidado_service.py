# ============================================
# SERVICE DE CONVIDADO (convites)
# ============================================
# CRUD dos convites criados pelo ADMIN (tabela "convidados") + a função que
# o cadastro usa para aplicar (e consumir) o convite de um e-mail.

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.convidado import Convidado
from app.models.user import User, RoleEnum
from app.schemas.convidado_schema import ConvidadoCreate, ConvidadoUpdate


def get_convidado(db: Session, convidado_id: int) -> Convidado:
    """Busca um convite pelo id; lança 404 se não existir."""
    convidado = db.query(Convidado).filter(Convidado.id == convidado_id).first()

    if not convidado:
        raise HTTPException(status_code=404, detail="Convite Não Encontrado")

    return convidado


def get_convidado_by_email(db: Session, email: str) -> Convidado | None:
    """Busca um convite pelo e-mail (pode retornar None)."""
    return db.query(Convidado).filter(Convidado.email == email).first()


def get_convidados(db: Session) -> list[Convidado]:
    """Lista todos os convites (mais recentes primeiro)."""
    return db.query(Convidado).order_by(Convidado.data_criacao.desc()).all()


def create_convidado(db: Session, data: ConvidadoCreate) -> Convidado:
    """Cria um convite para um e-mail; rejeita duplicatas (409).

    Também bloqueia o convite quando o e-mail já tem uma conta no sistema:
    quem já possui acesso não precisa de convite.
    """
    # O schema já recusa o papel ADMIN; aqui as checagens de conflito.
    # unique=True no model também impediria a duplicata, mas como erro 500;
    # checando antes, a mensagem para o ADMIN fica clara.
    if get_convidado_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Já existe um convite para este e-mail")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=409,
            detail="Este e-mail já tem uma conta no sistema (não precisa de convite)",
        )

    convidado = Convidado(email=data.email, role=data.role)

    # Sequência padrão do projeto: add -> commit -> refresh.
    db.add(convidado)
    db.commit()
    db.refresh(convidado)
    return convidado


def update_convidado(db: Session, convidado_id: int, data: ConvidadoUpdate) -> Convidado:
    """Edita apenas os campos realmente enviados (update parcial)."""
    # 404 sai daqui se o convite não existir.
    convidado = get_convidado(db, convidado_id)

    updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}

    # Mesma proteção do schema de criação: um convite nunca pode virar ADMIN.
    if updates.get("role") == RoleEnum.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Não é permitido convidar um usuário com o papel ADMIN",
        )

    for key, value in updates.items():
        setattr(convidado, key, value)

    db.commit()
    db.refresh(convidado)
    return convidado


def delete_convidado(db: Session, convidado_id: int) -> None:
    """Remove um convite (ex.: o ADMIN resolveu cancelar o convite)."""
    # 404 sai daqui se o convite não existir.
    convidado = get_convidado(db, convidado_id)

    db.delete(convidado)
    db.commit()


def obter_role_do_convite(db: Session, email: str) -> RoleEnum | None:
    """Devolve o papel de um convite para o e-mail, sem consumi-lo.

    Usado pelo cadastro (POST /auth/register): o convite é apenas LIDO aqui,
    porque a criação do usuário pode falhar (ex.: 409 de e-mail duplicado) —
    e nesse caso o convite não deve ser perdido. O consumo acontece só depois
    do sucesso, em consumir_convite.
    """
    convidado = get_convidado_by_email(db, email)
    return convidado.role if convidado else None


def consumir_convite(db: Session, email: str) -> None:
    """Apaga o convite do e-mail após o cadastro ser concluído com sucesso.

    O convite é de uso único: depois que o funcionário criou a conta com o
    papel certo, ele deixa de fazer sentido.
    """
    convidado = get_convidado_by_email(db, email)

    if convidado:
        db.delete(convidado)
        db.commit()