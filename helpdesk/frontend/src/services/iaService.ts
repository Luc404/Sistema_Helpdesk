// ============================================
// SERVIÇO DE INTELIGÊNCIA ARTIFICIAL
// ============================================
// Ponte entre o widget de chat e o endpoint /ai/chat.
// Usa a instância "api" para herdar o token e o tratamento de 401.

import { api } from './api';

export type PapelMensagem = 'user' | 'assistant';

export interface MensagemChat {
    papel: PapelMensagem;
    conteudo: string;
}

export interface RespostaChat {
    resposta: string;
    modelo: string;
    fontes: string[];
}

export interface StatusIA {
    ia_configurada: boolean;
    chat_disponivel: boolean;
    prioridade_automatica: boolean;
}

export const iaService = {
    async chat(
        mensagem: string,
        historico: MensagemChat[],
        ticketId?: number,
    ): Promise<RespostaChat> {
        // Timeout maior que o padrão: o modelo pode levar alguns segundos.
        const response = await api.post<RespostaChat>(
            '/ai/chat',
            {
                mensagem,
                historico,
                ticket_id: ticketId ?? null,
            },
            { timeout: 30000 },
        );

        return response.data;
    },

    async status(): Promise<StatusIA> {
        const response = await api.get<StatusIA>('/ai/status');
        return response.data;
    },
};
