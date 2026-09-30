# ============================================
# SERVICE DE REDEFINIÇÃO DE SENHA ("esqueci minha senha")
# ============================================
# Reúne as regras de negócio do fluxo de recuperação de senha, que tem
# DUAS etapas no backend:
#
#   1ª etapa  ->  create_reset_token()   gera um token e devolve um link
#   2ª etapa  ->  reset_password()       valida o token e grava a nova senha
#
# Decisões de segurança implementadas aqui:
#   - O token é gerado com "secrets" (criptograficamente seguro) e não
#     com uuid, que é previsível.
#   - O token tem prazo de validade (PASSWORD_RESET_EXPIRE_MINUTES).
#   - O token é de USO ÚNICO: some do banco assim que a senha é trocada.
#   - Pedidos novos invalidam os tokens anteriores do mesmo usuário, para
#     que exista no máximo um link vivo por conta.
#   - A resposta NÃO revela se o e-mail existe (anti-enumeração de contas).
#
# Por que o e-mail não é enviado de verdade: o projeto não possui um
# servidor SMTP configurado. Enquanto isso, o link de redefinição é
# devolvido no corpo da resposta e mostrado na tela (ver
# frontend/src/pages/EsqueceuSenha.jsx). O ponto de troca para o envio
# real está isolado em montar_link_redefinicao().

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.password_reset_token import PasswordResetToken
from app.models.user import StatusEnum, User


# Mensagem devolvida em TODOS os casos do pedido de token, exista o e-mail
# ou não. Se a API devolvesse 404 para e-mails desconhecidos, um atacante
# conseguiria descobrir quais contas existem tentando e-mails e observing
# a diferença de resposta. Por isso o endpoint responde sempre 200.
MENSAGEM_NEUTRA = (
    "Se o e-mail informado estiver cadastrado, você receberá as instruções "
    "de redefinição de senha."
)


def _agora() -> datetime:
    """Devolve o instante atual em UTC (naive), pronto para comparar com expira_em.

    O banco (SQLite/PostgreSQL) devolve "expira_em" sem fuso horário mesmo
    quando a coluna foi declarada com timezone=True. Normalizar os dois
    lados para "naive UTC" evita o erro:
        TypeError: can't compare offset-naive and offset-aware datetimes
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _expirado(expira_em: datetime) -> bool:
    """Informa se a data de expiração do token já passou.

   (parametro) expira_em: data/hora de expiração gravada no token.
    (retorno): True quando o token não pode mais ser usado.
    """
    # Se o banco entregou a data com fuso, remove para ficar naive-UTC
    # e permitir a comparação feita em _agora().
    if expira_em.tzinfo is not None:
        expira_em = expira_em.replace(tzinfo=None)

    return expira_em < _agora()


def _revogar_tokens_anteriores(db: Session, user_id: int) -> None:
    """Apaga os tokens ainda válidos do usuário, para que só exista um link vivo.

    Sem isso, alguém poderia pedir cinco tokens e usar o mais antigo,
    que estaria perto de expirar, ou o mais novo, indefinitely: cada
    pedido novo tornaria o link anterior inválido, que é o comportamento
    esperado em "enviei um novo e-mail, quero usar esse".
    """
    tokens_antigos = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user_id)
        .all()
    )

    for token in tokens_antigos:
        db.delete(token)


def _limpar_tokens_expirados(db: Session) -> int:
    """Remove da tabela os tokens que já venceram (limpeza de lixo antigo).

    É chamada a cada novo pedido de redefinição. Sem essa faxina, a tabela
    password_reset_tokens cresceria para sempre, já que o token só é
    apagado quando alguém tenta usá-lo.

    (retorno): quantidade de registros removidos (só para log/testes).
    """
    expirados = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.expira_em < _agora())
        .all()
    )

    for token in expirados:
        db.delete(token)

    return len(expirados)


def montar_link_redefinicao(token: str) -> str:
    """Monta o link completo que o usuário deveria receber por e-mail.

    >>> ESTE É O PONTO DE TROCA PARA O E-MAIL REAL <<<
    Hoje o link é apenas devolvido na resposta da API e exibido na tela,
    porque o projeto não tem SMTP configurado. Quando houver servidor de
    e-mail, este valor deve ser enviado para o usuário (e a resposta da API
    deve parar de devolver o token, para não vazar o acesso por quem
    interceptar a chamada).

    (parametro) token: token cru gerado em create_reset_token().
    (retorno): URL completo, ex.: http://localhost:5173/redefinir-senha?token=...
    """
    return f"{settings.FRONTEND_URL.rstrip('/')}/redefinir-senha?token={token}"


def create_reset_token(db: Session, email: str) -> dict:
    """Gera um token de redefinição para o e-mail informado (1ª etapa).

    (parametro) db: sessão do banco injetada pelo FastAPI.
    (parametro) email: e-mail digitado na tela "Esqueceu a senha".
    (retorno): dicionário com "mensagem" (sempre igual) e, apenas em
               desenvolvimento, "token" e "link".

    Observações de segurança:
      - NÃO levanta 404 quando o e-mail não existe. A resposta é a mesma
        nos dois casos, para não permitir que se descubram contas cadastradas.
      - Conta INATIVA também recebe a resposta neutra (sem gerar token).
      - Pode ser chamado várias vezes seguidas pelo mesmo usuário: cada
        pedido revoga o token anterior e cria um novo.
    """
    # Faxina: apaga tokens vencidos de qualquer usuário antes de começar.
    _limpar_tokens_expirados(db)

    user = (
        db.query(User)
        .filter(User.email == email, User.status == StatusEnum.ATIVO)
        .first()
    )

    # E-mail inexistente ou conta inativa: a resposta é idêntica à de sucesso.
    # O código_http 200 é mantido para que o frontend não diferencie os casos.
    if not user:
        db.commit()  # persiste a limpeza feita por _limpar_tokens_expirados
        return {"mensagem": MENSAGEM_NEUTRA, "token": None, "link": None}

    # Só pode existir um link vivo por conta: derruba os anteriores.
    _revogar_tokens_anteriores(db, user.id)

    # secrets.token_urlsafe gera um valor aleatório e criptograficamente
    # seguro (diferente de um uuid comum, que é previsível). 32 bytes
    # resultam em ~43 caracteres, impossível de adivinhar por tentativa.
    token = secrets.token_urlsafe(32)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        # Prazo de validade lido das configurações (padrão: 120 minutos).
        expira_em=_agora() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
    )

    db.add(reset_token)
    db.commit()

    # Em produção o token NÃO deve sair daqui: ele viajaria no corpo do
    # e-mail. Enquanto não houver SMTP, devolvemos para o front exibir.
    return {
        "mensagem": MENSAGEM_NEUTRA,
        "token": token,
        "link": montar_link_redefinicao(token),
    }


def validar_token(db: Session, token: str) -> PasswordResetToken:
    """Confere se o token existe e ainda está dentro do prazo de validade.

    Usado pela 2ª etapa e também pela tela de redefinição, que chama este
    método ao abrir a página para avisar se o link já venceu.

    (parametro) db: sessão do banco injetada pelo FastAPI.
    (parametro) token: token recebido pelo usuário.
    (retorno): o registro PasswordResetToken correspondente.

    Erros:
      400 -> token inexistente ("Token inválido")
      400 -> token vencido ("Token expirado ou já utilizado")
    """
    reset_token = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == token)
        .first()
    )

    # Token não existe no banco: nunca foi gerado, já foi usado
    # ou foi apagado por um pedido mais recente.
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido",
        )

    # Token existe mas venceu o prazo (ou o usuário já usou outro token
    # depois deste, o que também o removeu do banco no passo anterior).
    if _expirado(reset_token.expira_em):
        db.delete(reset_token)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado ou já utilizado",
        )

    return reset_token


def reset_password(db: Session, token: str, nova_senha: str) -> User:
    """Troca a senha do usuário usando o token (2ª etapa do fluxo).

    (parametro) db: sessão do banco injetada pelo FastAPI.
    (parametro) token: token recebido pelo usuário (pelo link ou colado na tela).
    (parametro) nova_senha: senha nova, ainda em texto puro.
    (retorno): o usuário atualizado, já com a senha nova gravada.

    Erros:
      400 -> token inexistente, expirado ou já utilizado (via validar_token)
      422 -> senha curta demais (via _validar_forca_senha)
    """
    # Import local (e não no topo do arquivo) para evitar dependência
    # circular entre o service e o módulo de segurança.
    from app.security import hash_password

    _validar_forca_senha(nova_senha)

    # Busca e confere o token. Qualquer problema já é convertido em 400 aqui.
    reset_token = validar_token(db, token)

    user = db.query(User).filter(User.id == reset_token.user_id).first()

    # Token órfão: o usuário foi apagado do banco depois que o token
    # foi gerado. O token é removido para não sobrar um registro
    # apontando para um id inexistente.
    if not user:
        db.delete(reset_token)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário do token não existe mais",
        )

    # Grava a nova senha (hasheada) e consome o token na mesma transação:
    # se o commit falhar, nenhuma das duas alterações é mantida.
    user.senha = hash_password(nova_senha)
    db.delete(reset_token)  # token de uso único
    db.commit()
    db.refresh(user)

    return user


def _validar_forca_senha(senha: str) -> None:
    """Aplica as regras mínimas de senha do projeto.

    Hoje a única regra é o tamanho mínimo, configurado em
    SENHA_MINIMO_CARACTERES (padrão: 6 caracteres). As telas já avisam
    sobre isso antes de chamar a API, mas a validação precisa existir
    TAMBÉM aqui: o frontend pode ser contornado chamando a rota direto.

    (parametro) senha: senha nova em texto puro.
    (retorno): None quando a senha é aceita.

    Erros:
      422 -> senha vazia ou curta demais.
    """
    if not senha or not senha.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A senha não pode ficar em branco",
        )

    minimo = settings.SENHA_MINIMO_CARACTERES

    if len(senha) < minimo:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"A senha precisa ter ao menos {minimo} caracteres",
        )


def obter_situacao_token(db: Session, token: str) -> dict:
    """Informa se um token ainda pode ser usado, sem alterar nada no banco.

    Serve para a tela de redefinição consultar se o link ainda é válido.
    Nunca levanta exceção: um token ruim devolve {"valido": False} para
    que a tela consiga exibir a mensagem sem try/catch.

    (parametro) db: sessão do banco injetada pelo FastAPI.
    (parametro) token: token a ser conferido.
    (retorno): dicionário com:
        - "valido"  : bool, se o token pode ser usado agora;
        - "mensagem": texto amigável explicando o motivo quando inválido.
    """
    try:
        validar_token(db, token)
        return {
            "valido": True,
            "mensagem": "Token válido. Defina a nova senha.",
        }
    except HTTPException as erro:
        return {
            "valido": False,
            "mensagem": erro.detail,
        }
