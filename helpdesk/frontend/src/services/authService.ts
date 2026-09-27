// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================
// Funções que falam com os endpoints /auth do backend.
// As telas NÃO chamam a API diretamente: elas usam este objeto.
//
// Endpoints cobertos (veja app/routers/auth_router.py):
//   POST /auth/register         -> cadastro
//   POST /auth/login            -> login
//   GET  /auth/me               -> eu
//   POST /auth/forgot-password  -> esqueceuSenha
//   POST /auth/reset-password   -> redefinirSenha

import { api } from './api';

// Corpo aceito por POST /auth/login (e também usado no cadastro).
export interface LoginPayload {
    email: string;
    senha: string;
}

// Espelha o RoleEnum do backend (app/models/user.py)
export type Role = 'USUARIO' | 'TECNICO';

// Usuário como a API o devolve (espelha o schema UserResponse).
export interface AuthUser {
    id: number;
    nome: string;
    email: string;
    data_nascimento: string | null;
    unidade_id: number | null;
    status: 'ATIVO' | 'INATIVO';
    role: Role;
    data_criacao: string;
}

// Formato real devolvido por POST /auth/login
export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: AuthUser;
}

export const authService = {
    // Autentica o usuário e devolve o token + os dados do perfil.
    // Erros esperados: 401 (e-mail ou senha errados) e 403 (conta inativa).
    async login(dados: LoginPayload): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', dados);
        return response.data;
    },

    // Cadastro público de uma nova conta.
    // O usuário nasce sempre com role USUARIO: a promoção para TÉCNICO
    // é feita depois por um técnico em PUT /users/{id}.
    // Erro esperado: 409 quando o e-mail já está cadastrado.
    async cadastro(dados: { nome: string; email: string; senha: string; }) {
        const response = await api.post('/auth/register', dados);
        return response.data;
    },

    // Retorna os dados do usuário do token, com a role lida direto do banco
    // (GET /auth/me). É esta chamada que o AuthProvider usa para decidir
    // se a sessão salva ainda é válida.
    async eu(): Promise<AuthUser> {
        const response = await api.get<AuthUser>('/auth/me');
        return response.data;
    },

    // 1ª etapa do fluxo "esqueci minha senha": solicita um token de
    // redefinição válido por 2 horas. Erro esperado: 404 (e-mail
    // inexistente ou conta inativa).
    async esqueceuSenha(email: string) {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    // POST /auth/reset-password — finaliza a troca de senha.
    // O "token" é o valor devolvido por "esqueceuSenha" (válido por 2 horas
    // e de uso único). Em produção ele chegaria por e-mail.
    async redefinirSenha(token: string, novaSenha: string) {
        const response = await api.post('/auth/reset-password', {
            token,
            nova_senha: novaSenha,
        });
        return response.data;
    },
};
