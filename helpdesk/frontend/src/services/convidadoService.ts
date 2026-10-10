// ============================================
// SERVIÇO DE CONVIDADOS (convites do ADMIN)
// ============================================
// Funções que falam com os endpoints /convidados.
// O ADMIN usa para convidar funcionários por e-mail: quando a pessoa fizer
// o cadastro público (POST /auth/register), o backend aplica o papel do
// convite automaticamente e o consome.
//
// TODAS as rotas exigem perfil ADMIN (403 para os demais).

import { api } from './api';
import type { Role } from './authService';

// Formato devolvido por GET /convidados (app/schemas/convidado_schema.py)
export interface Convidado {
    id: number;
    email: string;
    role: Role;
    data_criacao: string;
}

// Corpo aceito por POST /convidados (ConvidadoCreate)
export interface ConvidadoCreate {
    email: string;
    role: Role;
}

// Ponte entre o painel do ADMIN e a API de convites.
export const convidadoService = {
    // GET /convidados/ — exige ADMIN. Lista os convites pendentes.
    async listar(): Promise<Convidado[]> {
        const response = await api.get<Convidado[]>('/convidados/');
        return response.data;
    },

    // POST /convidados/ — exige ADMIN.
    // "role" só pode ser USUARIO ou TECNICO (o backend recusa ADMIN).
    // Erro esperado (409): e-mail já convidado ou já tem conta cadastrada.
    async criar(dados: ConvidadoCreate): Promise<Convidado> {
        const response = await api.post<Convidado>('/convidados/', dados);
        return response.data;
    },

    // DELETE /convidados/{id} — exige ADMIN. Cancela um convite pendente.
    async remover(id: number): Promise<void> {
        await api.delete(`/convidados/${id}`);
    },
};