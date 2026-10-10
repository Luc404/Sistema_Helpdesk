# ============================================
# ROUTER WEBSOCKET (tempo real do ADMIN)
# ============================================
# Endpoint websocket que alimenta o painel do administrador em tempo real.
#
# FLUXO:
#   1. O frontend conecta em "/ws/tickets?token=<jwt do admin>".
#   2. O token é validado e o usuário precisa ser ADMIN (senão a conexão
#      é fechada com o código 1008).
#   3. Ao conectar, o painel já recebe a lista completa de chamados.
#   4. A partir daí, toda alteração de chamado (create/update/delete) é
#      transmitida pelo TicketConnectionManager (broadcast_tickets) para
#      todos os painéis conectados.
#
# DIFERENÇA PARA AS ROTAS REST:
#   As rotas REST usam token no header Authorization; websocket não tem
#   header fácil de ler no navegador, então o token viaja na query string.
#   Como o token é curto e efêmero (expira em poucos minutos), o risco de
#   vaza-lo em logs é pequeno — uma solução aceitável para este painel.

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.database import SessionLocal
from app.models.user import RoleEnum, StatusEnum, User
from app.security import decode_access_token
from app.websocket_manager import manager

router = APIRouter()


@router.websocket("/ws/tickets")
async def ws_tickets(websocket: WebSocket, token: str = Query(...)):
    """
    Canal de tempo real dos chamados (painel ADMIN).

    Caminho de acesso:
        ws://127.0.0.1:8000/ws/tickets?token=<token JWT do administrador>

    Protocolo (mensagens):
      - Servidor -> Cliente: uma lista JSON com TODOS os chamados
        (mesmo formato de GET /tickets/detalhes). O servidor envia uma
        mensagem a cada alteração de chamado.
      - Cliente -> Servidor: nada. O cliente pode simplesmente manter a
        conexão aberta; o recebimento é por push.

    Códigos de fechamento:
      - 1008 (policy violation): token ausente/inválido ou usuário sem
        papel ADMIN.
    """
    # Sessão própria do websocket (as dependências de rota não funcionam
    # em conexões websocket, então abrimos e fechamos a sessão aqui).
    db = SessionLocal()

    try:
        # Valida o token vindo pela query string. A assinatura e a
        # expiração são conferidas dentro de decode_access_token.
        payload = decode_access_token(token)

        if not payload or "sub" not in payload:
            await websocket.close(code=1008)
            return

        try:
            user_id = int(payload["sub"])
        except (TypeError, ValueError):
            await websocket.close(code=1008)
            return

        admin = (
            db.query(User)
            .filter(User.id == user_id, User.status == StatusEnum.ATIVO)
            .first()
        )

        # Só o ADMIN acompanha todos os chamados: a conexão é recusada
        # para técnicos e usuários comuns (eles têm suas próprias telas).
        if not admin or admin.role != RoleEnum.ADMIN:
            await websocket.close(code=1008)
            return

        # Registra a conexão e já envia o estado atual da fila.
        await manager.connect(websocket)
        await manager.enviar_para(websocket, db)

        # Mantém a conexão viva ouvindo o cliente. Nada chega na prática;
        # o loop existe para detectar o fechamento do navegador.
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        # Fez logout ou fechou a aba: remove o painel da lista de ativos.
        manager.disconnect(websocket)
    except Exception:  # noqa: BLE001 - qualquer falha só encerra esta conexão
        manager.disconnect(websocket)
    finally:
        db.close()