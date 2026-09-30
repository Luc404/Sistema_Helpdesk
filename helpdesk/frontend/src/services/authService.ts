// ============================================
// SERVIÇO DE AUTENTICAÇÃO
// ============================================
// Funções que falam com os endpoints /auth do backend.
// As telas NÃO chamam a API diretamente: elas usam este objeto.
//
// Endpoints cobertos (veja app/routers/auth_router.py):
//   POST /auth/register               -> cadastro
//   POST /auth/login                  -> login
//   GET  /auth/me                     -> eu
//   POST /auth/forgot-password        -> esqueceuSenha
//   GET  /auth/reset-password/validar -> validarTokenReset
//   POST /auth/reset-password         -> redefinirSenha

import { api } from './api';

// Corpo aceito por POST /auth/login (e também usado no cadastro).
export interface LoginPayload {
    email: string;
    senha: string;
}

// Espelha o RoleEnum do backend (app/models/user.py)
export type Role = 'USUARIO' | 'TECNICO';

// Situação da conta, espelha o StatusEnum do backend.
export type Status = 'ATIVO' | 'INATIVO';

// Usuário como a API o devolve (espelha o schema UserResponse).
export interface AuthUser {
    id: number;
    nome: string;
    email: string;
    data_nascimento: string | null;
    unidade_id: number | null;
    status: Status;
    role: Role;
    data_criacao: string;
}

// Formato real devolvido por POST /auth/login
export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: AuthUser;
}

// Resposta de POST /auth/forgot-password (1ª etapa da recuperação).
//
// "token" e "link" NUNCA viriam preenchidos em produção: eles existem
// porque o projeto não tem servidor de e-mail configurado, então o
// link precisa ser mostrado na tela para o usuário conseguir testar.
// Quando o SMTP existir, o backend deixa de devolvê-los.
export interface EsqueceuSenhaResponse {
    mensagem: string;
    token: string | null;
    link: string | null;
}

// Resposta de GET /auth/reset-password/validar.
export interface SituacaoToken {
    valido: boolean;
    mensagem: string;
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
    async cadastro(dados: { nome: string; email: string; senha: string; data_nascimento?: string | null; }) {
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
    // redefinição válido por PASSWORD_RESET_EXPIRE_MINUTES minutos (120 por padrão).
    //
    // IMPORTANTE: esta rota responde 200 mesmo quando o e-mail não existe
    // (anti-enumeração de contas). Por isso a tela NÃO pode mostrar erro
    // olhando o status da requisição — ela deve exibir sempre a mensagem
    // devolvida em "mensagem", e mostrar o link só quando "link" vier preenchido.
    async esqueceuSenha(email: string): Promise<EsqueceuSenhaResponse> {
        const response = await api.post<EsqueceuSenhaResponse>('/auth/forgot-password', { email });
        return response.data;
    },

    // Confere se um token ainda pode ser usado. A tela /redefinir-senha chama
    // esta função ao abrir para avisar se o link já venceu ou já foi usado.
    // Nunca lança erro: um token inválido volta como { valido: false }.
    async validarTokenReset(token: string): Promise<SituacaoToken> {
        const response = await api.get<SituacaoToken>('/auth/reset-password/validar', {
            params: { token },
        });
        return response.data;
    },

    // 2ª etapa: finaliza a troca de senha.
    // O "token" é o valor devolvido por "esqueceuSenha" (válido por 120
    // minutos e de uso único). Em produção ele chegaria por e-mail.
    //
    // Erros esperados:
    //   400 -> token inválido, expirado ou já utilizado;
    //   422 -> a senha nova tem menos de 6 caracteres (regra do backend).
    async redefinirSenha(token: string, novaSenha: string) {
        const response = await api.post('/auth/reset-password', {
            token,
            nova_senha: novaSenha,
        });
        return response.data;
    },
};
