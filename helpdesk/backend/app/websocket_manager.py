# ============================================
# GERENCIADOR DE CONEXÕES WEBSOCKET (painel do ADMIN)
# ============================================
# Guarda as conexões websocket abertas do painel do administrador
# (frontend/src/pages/AdminHome.jsx conecta em /ws/tickets) e é quem
# distribui a lista atualizada de chamados para todas elas.
#
# COMO FUNCIONA:
#   1. Cada admin conectado entra em "connections".
#   2. Ao conectar, ele já recebe o estado atual (enviar_para).
#   3. Toda vez que um chamado é criado/editado/removido, o ticket_router
#      chama broadcast_tickets, que recalcula a lista e manda a MESMA
#      mensagem para todos os painéis conectados.
#
# POR QUE RECALCULAR A LISTA INTEIRA (e não só o ticket alterado):
#   Com poucos chamados e poucos admins, mandar a lista completa é mais
#   simples e quase tão barato quanto mandar o delta — e elimina toda a
#   complexidade de sincronizar inserção/edição/remoção no cliente.

import json
from types import SimpleNamespace

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder

from app.models.user import RoleEnum
from app.services import ticket_service


class TicketConnectionManager:
    """Mantém as conexões websocket abertas e transmite a lista de chamados."""

    def __init__(self):
        # Lista de websockets conectados (painéis do ADMIN abertos no navegador).
        self.connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Aceita a conexão e a registra na lista de painéis ativos."""
        await websocket.accept()
        self.connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove uma conexão da lista (página fechada ou conexão perdida)."""
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def _montar_mensagem(self, db) -> str:
        """Gera o JSON com TODOS os chamados, no formato que o painel espera.

        Usa o mesmo formato de GET /tickets/detalhes (com nomes resolvidos).
        Um SimpleNamespace desempenha o papel de current_user para
        ticket_service.query_visiveis devolver a query completa (papel ADMIN),
        sem precisar criar um objeto User de verdade.
        """
        # "Admin de mentira": só o atributo usado pela visibilidade.
        admin_view = SimpleNamespace(role=RoleEnum.ADMIN)

        try:
            # Se houver QUALQUER erro consultando o banco (ex.: conexão
            # caindo), devolve lista vazia em vez de derrubar o websocket.
            tickets = ticket_service.get_tickets_detalhe(db, admin_view)
        except Exception:  # noqa: BLE001 - broadcast nunca pode quebrar a conexão
            tickets = []

        # jsonable_encoder converte datetime/enums do SQLAlchemy nos mesmos
        # formatos que o REST devolve (ISO 8601 etc.). O JSON completo vai
        # no corpo da mensagem websocket.
        return json.dumps(jsonable_encoder(tickets), ensure_ascii=False)

    async def enviar_para(self, websocket: WebSocket, db) -> None:
        """Manda o estado atual para UMA conexão (usado logo após conectar)."""
        await websocket.send_text(await self._montar_mensagem(db))

    async def broadcast_tickets(self, db) -> None:
        """Recalcula a lista de chamados e envia para TODOS os painéis.

        (parametro) db: a mesma sessão do endpoint que disparou o broadcast
        (create/update/delete do ticket_router), já que ela segue aberta.
        """
        # Sem ninguém conectado, não há trabalho algum a fazer.
        if not self.connections:
            return

        mensagem = await self._montar_mensagem(db)

        # Conexões quebradas são registradas e removidas no fim, para não
        # interromper o envio para as demais.
        conexoes_removidas = []

        for conexao in self.connections:
            try:
                await conexao.send_text(mensagem)
            except Exception:  # noqa: BLE001 - conexão caiu (página fechada)
                conexoes_removidas.append(conexao)

        for conexao in conexoes_removidas:
            self.disconnect(conexao)


# Instância única compartilhada por ws_router (conexões) e ticket_router (broadcast).
manager = TicketConnectionManager()