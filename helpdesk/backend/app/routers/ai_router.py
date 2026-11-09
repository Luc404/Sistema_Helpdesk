# ============================================
# ROUTER DE INTELIGÊNCIA ARTIFICIAL (endpoints /ai)
# ============================================
# Expõe o chatbot de dúvidas e o status da IA.
# A prioridade dos chamados é definida na própria rota POST /tickets.

from time import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_schema import (
    ChatRequest,
    ChatResponse,
    IAStatusResponse,
)
from app.services import ai_service, ticket_service

router = APIRouter(prefix="/ai", tags=["Inteligência Artificial"])

_ACESSOS_POR_USUARIO: dict[int, list[float]] = {}


def _valor_enum(valor):
    return valor.value if hasattr(valor, "value") else str(valor)


def _verificar_limite(user_id: int) -> None:
    agora = time()
    marcas = [
        marca
        for marca in _ACESSOS_POR_USUARIO.get(user_id, [])
        if agora - marca < 3600
    ]

    if len(marcas) >= settings.AI_CHAT_MAX_POR_HORA:
        _ACESSOS_POR_USUARIO[user_id] = marcas
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Limite de mensagens por hora atingido. Tente novamente mais tarde.",
        )

    marcas.append(agora)
    _ACESSOS_POR_USUARIO[user_id] = marcas


def _montar_contexto_chamado(ticket) -> dict:
    return {
        "id": ticket.id,
        "titulo": ticket.titulo,
        "descricao": ticket.descricao,
        "status": _valor_enum(ticket.status),
        "prioridade": _valor_enum(ticket.prioridade),
        "tipo_problema": ticket.tipo_problema,
        "servico": ticket.servico.nome if ticket.servico else None,
        "unidade": ticket.unidade.nome if ticket.unidade else None,
        "data_criacao": (
            ticket.data_criacao.isoformat() if ticket.data_criacao else None
        ),
    }


# ----------------------------------------------------------
# ROTA: GET /ai/status  ->  Status da IA
# ----------------------------------------------------------
@router.get("/status", response_model=IAStatusResponse)
async def status_ia(current_user: User = Depends(get_current_user)):
    """Informa se há um provedor de IA configurado.

    O chat continua funcionando em modo de regras quando a chave não está
    configurada; o campo `ia_configurada` distingue os dois modos.
    """
    return IAStatusResponse(
        ia_configurada=ai_service.ia_configurada(),
        chat_disponivel=True,
        prioridade_automatica=True,
    )


# ----------------------------------------------------------
# ROTA: POST /ai/chat  ->  Conversar com o assistente
# ----------------------------------------------------------
@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Responde uma dúvida com base na base de conhecimento.

    Se `ticket_id` for enviado, o backend confere a permissão do usuário
    antes de incluir o chamado no contexto. O histórico enviado pelo
    cliente é limitado e só aceita os papéis `user` e `assistant`.

    Respostas:
      200 → resposta do assistente.
      401 → usuário não autenticado.
      403 → chamado sem permissão de acesso.
      404 → chamado inexistente.
      429 → limite de mensagens por hora atingido.
    """
    _verificar_limite(current_user.id)

    contexto = None

    if data.ticket_id is not None:
        ticket = ticket_service.can_access(db, data.ticket_id, current_user)
        contexto = _montar_contexto_chamado(ticket)

    historico = [
        {"papel": mensagem.papel, "conteudo": mensagem.conteudo}
        for mensagem in data.historico
    ]

    resultado = await ai_service.responder_chat(
        mensagem=data.mensagem,
        historico=historico,
        contexto_chamado=contexto,
    )

    return ChatResponse(
        resposta=resultado.resposta,
        modelo=resultado.modelo,
        fontes=resultado.fontes,
    )
