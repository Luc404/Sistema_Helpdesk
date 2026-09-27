// ============================================
// SERVIÇO DE SERVIÇOS
// ============================================
// Funções que falam com os endpoints /servicos.
// Usado na Home (cards de serviço) e no formulário de abertura de chamado.

import { api } from './api';

// Formato devolvido por GET /servicos (app/schemas/servico_schema.py)
export interface Servico {
    id: number;
    nome: string;
    descricao: string;
    icone: string | null;
}

// Dados para criar um serviço (ServicoCreate)
export interface ServicoCreate {
    nome: string;
    descricao: string;
    icone?: string | null;
}

// Dados para editar um serviço (ServicoUpdate — update parcial:
// envie apenas os campos que mudarem)
export interface ServicoUpdate {
    nome?: string;
    descricao?: string;
    icone?: string | null;
}

// Ponte entre a tela de serviços e a API.
// Regra do projeto: nenhuma página chama "api" diretamente, só os services.
export const servicoService = {
    // GET /servicos/ — rota pública, usada na Home e no formulário de chamado.
    // Traz nome, descrição e ícone, que é exatamente o que o card da Home mostra.
    async listar(): Promise<Servico[]> {
        const response = await api.get<Servico[]>('/servicos/');
        return response.data;
    },

    // GET /servicos/{id}
    async detalhar(id: number): Promise<Servico> {
        const response = await api.get<Servico>(`/servicos/${id}`);
        return response.data;
    },

    // POST /servicos/ — exige perfil TÉCNICO, senão o backend devolve 403.
    async criar(dados: ServicoCreate): Promise<Servico> {
        const response = await api.post<Servico>('/servicos/', dados);
        return response.data;
    },

    // PUT /servicos/{id} — update parcial e exige perfil TÉCNICO.
    async atualizar(id: number, dados: ServicoUpdate): Promise<Servico> {
        const response = await api.put<Servico>(`/servicos/${id}`, dados);
        return response.data;
    },

    // DELETE /servicos/{id} — exige perfil TÉCNICO. Devolve 204 (sem corpo).
    async remover(id: number): Promise<void> {
        await api.delete(`/servicos/${id}`);
    },
};
