// ============================================
// HOOK: CHAMADOS EM TEMPO REAL (WebSocket /ws/tickets)
// ============================================
// Abre a conexão websocket do painel do ADMIN e expõe a lista de chamados,
// que é empurrada pelo servidor a cada alteração (criar/editar/remover).
//
// POR QUE EXISTE:
//   O painel do administrador precisa mostrar TODOS os chamados com a maior
//   frescor possível. Em vez de recarregar a página ou consultar a API a
//   cada poucos segundos (polling), o backend mantém um canal aberto:
//      /ws/tickets?token=<jwt do admin>
//
// COMO FUNCIONA:
//   1. Ao montar, abre a conexão usando o token salvo no localStorage.
//   2. A cada mensagem (JSON com a lista completa), atualiza o estado.
//   3. Se a conexão cair (servidor reiniciou, rede oscilou), reconecta
//      sozinho após RECONEXAO_SEGUNDOS — o painel fica "vivo" sem o usuário
//      precisar recarregar a página.
//
// O backend só aceita a conexão de usuários ADMIN (código de fechamento 1008
// para os demais perfis) — veja app/routers/ws_router.py.

import { useEffect, useRef, useState } from 'react';
import { authStorage } from '../services/authStorage';

// Mesmo endereço do axios (services/api.ts): host IPv4 explícito porque o
// Chrome resolve "localhost" para IPv6 antes do IPv4.
const WS_BASE = 'ws://127.0.0.1:8000';

// Tempo de espera antes de tentar reconectar após uma conexão cair.
const RECONEXAO_SEGUNDOS = 3000;

export const useChamadosTempoReal = () => {
  // Lista atual de chamados (mesmo formato de GET /tickets/detalhes).
  const [chamados, setChamados] = useState([]);

  // "true" quando há uma conexão aberta neste momento.
  const [conectado, setConectado] = useState(false);

  // Referência para o socket atual (permite fechar ao desmontar e evita
  // que o reconnect use um socket antigo).
  const socketRef = useRef(null);

  // Guarda o token uma única vez (não muda durante a sessão).
  const tokenRef = useRef(authStorage.getToken());

  useEffect(() => {
    // Impede setState depois que o componente desmonta (aviso do React).
    let cancelado = false;
    let temporizadorReconexao = null;

    // Serializa a lista recebida (o servidor manda JSON com os chamados).
    function tratarMensagem(evento) {
      try {
        const lista = JSON.parse(evento.data);

        // Segurança simples: só aceita o que parece uma lista de chamados.
        if (Array.isArray(lista)) {
          setChamados(lista);
        }
      } catch {
        // Mensagem inesperada/corrompida: ignora e aguarda a próxima.
        console.error('[useChamadosTempoReal] mensagem websocket inválida', evento.data);
      }
    }

    // Abre a conexão e instala os tratadores do socket.
    function abrirConexao() {
      // Sem token não há como autenticar o websocket — o painel não tem
      // como mostrar nada em tempo real.
      if (!tokenRef.current) {
        setConectado(false);
        return;
      }

      const url = `${WS_BASE}/ws/tickets?token=${encodeURIComponent(tokenRef.current)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!cancelado) setConectado(true);
      };

      socket.onmessage = tratarMensagem;

      socket.onclose = () => {
        if (cancelado) return;

        setConectado(false);

        // Reconecta após alguns segundos. Não tenta de novo se o
        // componente já foi desmontado.
        temporizadorReconexao = setTimeout(abrirConexao, RECONEXAO_SEGUNDOS);
      };

      socket.onerror = () => {
        // O onclose dispara logo depois e trata a reconexão.
        socket.close();
      };
    }

    abrirConexao();

    // Limpeza ao desmontar: fecha o socket e cancela reconexões pendentes.
    return () => {
      cancelado = true;

      if (temporizadorReconexao) {
        clearTimeout(temporizadorReconexao);
      }

      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return { chamados, conectado };
};