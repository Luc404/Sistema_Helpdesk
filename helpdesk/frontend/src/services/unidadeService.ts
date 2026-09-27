// ============================================
// SERVIÇO DE UNIDADES
// ============================================
// Funções que falam com os endpoints /unidades.
// Usado para preencher o <select> de unidade do novo chamado e para
// resolver "unidade_id" -> nome nas tabelas.

import { api } from './api';

// Formato devolvido por GET /unidades (app/schemas/unidade_schema.py)
export interface Unidade {
    id: number;
    nome: string;
}

// A unidade é um dado simples (só id e nome), por isso o update é
// separado em uma interface própria em vez de reusar a de criação.
export interface UnidadeUpdate {
    nome?: string;
}

// Ponte entre as telas e a API de unidades.
export const unidadeService = {
    // GET /unidades/ — pública. Usada para preencher o <select> de unidade
    // do formulário de chamado e para resolver unidade_id -> nome nas tabelas.
    async listar(): Promise<Unidade[]> {
        const response = await api.get<Unidade[]>('/unidades/');
        return response.data;
    },

    // GET /unidades/{id}
    async detalhar(id: number): Promise<Unidade> {
        const response = await api.get<Unidade>(`/unidades/${id}`);
        return response.data;
    },

    // POST /unidades/ — exige perfil TÉCNICO. Devolve 409 se o nome repetir,
    // porque o model define nome com unique=True.
    async criar(dados: Unidade): Promise<Unidade> {
        const response = await api.post<Unidade>('/unidades/', dados);
        return response.data;
    },

    // PUT /unidades/{id} — update parcial e exige perfil TÉCNICO.
    async atualizar(id: number, dados: UnidadeUpdate): Promise<Unidade> {
        const response = await api.put<Unidade>(`/unidades/${id}`, dados);
        return response.data;
    },

    // DELETE /unidades/{id} — exige perfil TÉCNICO.
    async remover(id: number): Promise<void> {
        await api.delete(`/unidades/${id}`);
    },
};
