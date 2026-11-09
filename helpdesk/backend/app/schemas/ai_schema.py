# ============================================
# SCHEMAS DE INTELIGÊNCIA ARTIFICIAL
# ============================================
# Formato de entrada e saída do chatbot (/ai/chat).
# O backend valida os papéis e os limites antes de chamar o modelo.

from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.config import settings


class MensagemHistorico(BaseModel):
    papel: Literal["user", "assistant"]
    conteudo: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    mensagem: str = Field(min_length=1, max_length=settings.AI_CHAT_MAX_CARACTERES)
    historico: list[MensagemHistorico] = Field(default_factory=list, max_length=50)
    ticket_id: Optional[int] = None


class ChatResponse(BaseModel):
    resposta: str
    modelo: str
    fontes: list[str] = Field(default_factory=list)


class IAStatusResponse(BaseModel):
    ia_configurada: bool
    chat_disponivel: bool
    prioridade_automatica: bool
