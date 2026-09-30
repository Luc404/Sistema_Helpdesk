# ============================================
# SCHEMAS DE SERVIÇO
# ============================================
# Definem o formato de entrada (Create/Update) e de saída (Response)
# dos serviços, e validam os dados antes de chegarem ao banco.
# O model correspondente está em app/models/servico.py.

from pydantic import BaseModel
from typing import Optional
from app.schemas.partial import PartialUpdate


class ServicoCreate(BaseModel):
    """Dados para criar um novo serviço."""
    nome: str      # Nome do serviço (obrigatório)
    descricao: str # O que o serviço cobre (obrigatório)
    icone: Optional[str] = None  # Ícone opcional usado no frontend


class ServicoResponse(BaseModel):
    """Formato retornado pela API para serviços."""
    id: int         # Identificador do serviço
    nome: str       # Nome do serviço
    descricao: str  # Descrição do serviço
    icone: Optional[str] = None  # Classe do Bootstrap Icons (ex.: "bi-easel")

    class Config:
        # Permite montar o schema a partir de um objeto do SQLAlchemy
        # (o model Servico) em vez de um dicionário.
        from_attributes = True


class ServicoUpdate(PartialUpdate):
    """Dados permitidos ao editar um serviço (update parcial seguro).

    Herda de PartialUpdate: string vazia é tratada como "não informado"
    e um payload totalmente vazio é recusado com erro 422.
    """
    nome: Optional[str] = None       # Novo nome (opcional)
    descricao: Optional[str] = None  # Nova descrição (opcional)
    icone: Optional[str] = None      # Novo ícone (opcional)

    # "icone" é a única coisa que faz sentido APAGAR: o técnico pode
    # querer voltar o serviço ao ícone padrão depois de ter escolhido
    # outro. Sem esta lista, {"icone": null} seria barrado pelo
    # "ao_menos_um_campo" do PartialUpdate, porque null significa
    # "não informado" para os demais campos. Aqui o null é intencional
    # e vale como alteração.
    campos_limpaveis = frozenset({"icone"})
