// ============================================
// SERVIÇO DE CHAMADOS (tickets)
// ============================================
// Funções que falam com os endpoints /tickets e /tickets/{id}/copias.
// As tabelas do frontend consomem estes serviços; nenhuma página chama
// a API diretamente.
//
// Regra de ouro: o backend já aplica a visibilidade dos chamados
// (ticket_service.query_visiveis), então o frontend NÃO deve filtrar
// por "cliente_id" — isso esconderia os chamados em cópia.

import { api } from './api';

// Status de um chamado (StatusEnum em app/models/ticket.py)
export type StatusChamado = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

// Prioridade de um chamado (PrioridadeEnum em app/models/ticket.py)
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA';

// Formato de GET /tickets — traz apenas os ids das relações.
export interface Chamado {
    id: number;
    titulo: string;
    descricao: string;
    status: StatusChamado;
    prioridade: Prioridade;
    tipo_problema: string;
    data_criacao: string;
    data_atualizacao: string;
    cliente_id: number;
    tecnico_id: number | null;
    servico_id: number;
    unidade_id: number;
}

// Formato de GET /tickets/detalhes — mesmo Chamado, porém com os nomes
// de cliente, técnico, serviço e unidade já resolvidos pelo backend.
// É esta versão que as tabelas do frontend devem consumir.
export interface ChamadoDetalhe extends Chamado {
    cliente_nome: string;
    tecnico_nome: string | null;
    servico_nome: string;
    unidade_nome: string;
}

// Corpo do POST /tickets (TicketCreate).
// Repare que "cliente_id" NÃO existe aqui: o backend usa automaticamente
// o usuário do token como dono do chamado.
export interface ChamadoCreate {
    titulo: string;
    descricao: string;
    servico_id: number;
    unidade_id: number;
    tipo_problema: string;
    prioridade?: Prioridade;
    tecnico_id?: number | null;
    copia_user_ids?: number[];
}

// Corpo do PUT /tickets/{id} (TicketUpdate — update parcial:
// envie apenas o campo que mudou).
export interface ChamadoUpdate {
    titulo?: string;
    descricao?: string;
    status?: StatusChamado;
    prioridade?: Prioridade;
    servico_id?: number;
    unidade_id?: number;
    tipo_problema?: string;
    tecnico_id?: number | null;
}

// Formato de GET e POST /tickets/{id}/copias
export interface Copia {
    id: number;
    ticket_id: number;
    user_id: number;
}

// Ponte entre as telas de chamado e a API.
export const chamadoService = {
    // GET /tickets/detalhes — a rota que as tabelas devem usar.
    // O backend já aplica a regra de visibilidade: o TÉCNICO recebe todos
    // os chamados e o USUÁRIO recebe apenas os que abriu e os que está em
    // cópia. Por isso o frontend NÃO deve filtrar por cliente_id.
    async listar(): Promise<ChamadoDetalhe[]> {
        const response = await api.get<ChamadoDetalhe[]>('/tickets/detalhes');
        return response.data;
    },

    // GET /tickets/{id} — devolve só os ids. Lança 403 se o usuário não
    // tiver acesso ao chamado (ticket_service.can_access).
    async detalhar(id: number): Promise<Chamado> {
        const response = await api.get<Chamado>(`/tickets/${id}`);
        return response.data;
    },

    // POST /tickets/ — exige token (qualquer usuário logado pode abrir).
    // O "cliente_id" é definido pelo backend a partir do token.
    async criar(dados: ChamadoCreate): Promise<Chamado> {
        const response = await api.post<Chamado>('/tickets/', dados);
        return response.data;
    },

    // PUT /tickets/{id} — ATENÇÃO: exige perfil TÉCNICO (403 para usuário comum).
    // Como o update é parcial, envie só o que mudou, por exemplo { status }.
    async atualizar(id: number, dados: ChamadoUpdate): Promise<Chamado> {
        const response = await api.put<Chamado>(`/tickets/${id}`, dados);
        return response.data;
    },

    // DELETE /tickets/{id} — permitido para o TÉCNICO ou para o dono do chamado.
    // Devolve 204 (sem corpo). As cópias são removidas em cascata.
    async remover(id: number): Promise<void> {
        await api.delete(`/tickets/${id}`);
    },

    // GET /tickets/{id}/copias — lista os usuários em cópia do chamado.
    async listarCopias(ticketId: number): Promise<Copia[]> {
        const response = await api.get<Copia[]>(`/tickets/${ticketId}/copias`);
        return response.data;
    },

    // POST /tickets/{id}/copias — body: { user_ids: [2, 3] }.
    // O backend ignora quem já está na lista. Devolve a lista atualizada.
    async adicionarCopias(ticketId: number, userIds: number[]): Promise<Copia[]> {
        const response = await api.post<Copia[]>(`/tickets/${ticketId}/copias`, {
            user_ids: userIds,
        });
        return response.data;
    },

    // DELETE /tickets/{id}/copias/{copiaId} — "copiaId" é o id do REGISTRO
    // de cópia (tabela ticket_copias), não o id do usuário.
    async removerCopia(ticketId: number, copiaId: number): Promise<void> {
        await api.delete(`/tickets/${ticketId}/copias/${copiaId}`);
    },
};
