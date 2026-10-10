// ============================================
// SERVIÇO DE SETORES
// ============================================
// Funções que falam com os endpoints /setores.
// Usado para preencher o <select> de setor no cadastro e para o admin
// gerenciar os setores (criar, editar, remover).

import { api } from './api';

// Formato devolvido por GET /setores (app/schemas/setor_schema.py)
export interface Setor {
    id: number;
    nome: string;
}

// A setor é um dado simples (só id e nome), por isso o update é separado.
export interface SetorUpdate {
    nome?: string;
}

// Ponte entre as telas e a API de setores.
export const setorService = {
    // GET /setores/ — pública. Alimenta o <select> do cadastro e a lista
    // do gerenciador de setores do admin.
    async listar(): Promise<Setor[]> {
        const response = await api.get<Setor[]>('/setores/');
        return response.data;
    },

    // GET /setores/{id}
    async detalhar(id: number): Promise<Setor> {
        const response = await api.get<Setor>(`/setores/${id}`);
        return response.data;
    },

    // POST /setores/ — exige perfil ADMIN. Devolve 409 se o nome repetir.
    async criar(dados: Setor): Promise<Setor> {
        const response = await api.post<Setor>('/setores/', dados);
        return response.data;
    },

    // PUT /setores/{id} — update parcial e exige perfil ADMIN.
    async atualizar(id: number, dados: SetorUpdate): Promise<Setor> {
        const response = await api.put<Setor>(`/setores/${id}`, dados);
        return response.data;
    },

    // DELETE /setores/{id} — exige perfil ADMIN.
    async remover(id: number): Promise<void> {
        await api.delete(`/setores/${id}`);
    },
};
