// ============================================
// SERVIÇO DE USUÁRIOS
// ============================================
// Funções que falam com os endpoints /users.
// Usado para montar a lista de "usuários em cópia" do novo chamado e
// para exibir o nome de quem abriu cada chamado.
//
// Atenção: o cadastro e a remoção de usuários são restritos ao perfil
// TÉCNICO; um usuário comum só edita o próprio cadastro.

import { api } from './api';
import type { AuthUser, Role } from './authService';

// Formato devolvido por GET /users (app/schemas/user_schema.py).
// É a mesma estrutura de UserResponse usada no login, reaproveitada aqui.
export type Usuario = AuthUser;

// Campos que um TÉCNICO pode enviar no PUT /users/{id}.
// "role" e "status" são recusados com 403 se quem chama não for técnico
// (regra implementada em app/routers/user_router.py).
export interface UsuarioUpdate {
    nome?: string;
    email?: string;
    senha?: string;
    data_nascimento?: string | null;
    unidade_id?: number | null;
    role?: Role;
    status?: 'ATIVO' | 'INATIVO';
}

// Ponte entre as telas e a API de usuários.
export const usuarioService = {
    // GET /users/ — exige token (qualquer usuário logado).
    // Usada para montar a lista de "usuários em cópia" do novo chamado
    // e para exibir o nome de quem abriu cada chamado.
    async listar(): Promise<Usuario[]> {
        const response = await api.get<Usuario[]>('/users/');
        return response.data;
    },

    // GET /users/{id}
    async detalhar(id: number): Promise<Usuario> {
        const response = await api.get<Usuario>(`/users/${id}`);
        return response.data;
    },

    // PUT /users/{id} — update parcial (envie só o que mudou).
    // Um usuário comum só edita o próprio cadastro e é bloqueado (403) se
    // tentar enviar "role" ou "status".
    async atualizar(id: number, dados: UsuarioUpdate): Promise<Usuario> {
        const response = await api.put<Usuario>(`/users/${id}`, dados);
        return response.data;
    },

    // Troca a senha do próprio usuário.
    // Existe separada só para deixar a intenção explícita na tela de perfil.
    async trocarSenha(id: number, senha: string): Promise<Usuario> {
        const response = await api.put<Usuario>(`/users/${id}`, { senha });
        return response.data;
    },

    // POST /users/ — exige perfil TÉCNICO. Cria sempre com role USUARIO;
    // para promover, chame "atualizar" com { role: 'TECNICO' } em seguida.
    async criar(dados: { nome: string; email: string; senha: string; data_nascimento?: string | null; unidade_id?: number | null }): Promise<Usuario> {
        const response = await api.post<Usuario>('/users/', dados);
        return response.data;
    },

    // DELETE /users/{id} — exige perfil TÉCNICO.
    async remover(id: number): Promise<void> {
        await api.delete(`/users/${id}`);
    },
};
