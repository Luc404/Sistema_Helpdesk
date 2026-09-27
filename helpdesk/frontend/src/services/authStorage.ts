// ============================================
// PERSISTÊNCIA DA SESSÃO NO NAVEGADOR (localStorage)
// ============================================
// O login devolve um token JWT que, sozinho, não sobrevive ao recarregar
// a página. Este módulo guarda o token e os dados do usuário no localStorage
// para que a sessão continue ativa ao fechar e reabrir o navegador.
//
// Por que o localStorage (e não um cookie)?
//   - É simples e sincrono, então o token pode ser lido já no primeiro
//     render do AuthProvider.
//   - Em compensação, o token fica acessível por qualquer JavaScript da
//     página (risco de XSS). Em produção, prefira httpOnly cookies.

// Chaves usadas no localStorage para manter a sessão entre recarregamentos
const TOKEN_KEY = 'helpdesk_token';
const USER_KEY = 'helpdesk_user';

// Acesso ao token e aos dados do usuário logado persistidos no navegador
export const authStorage = {
    // Devolve o token JWT salvo, ou null se o usuário não estiver logado.
    // É este valor que o interceptor de api.ts manda no header Authorization.
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    // Devolve o usuário salvo já convertido de JSON para objeto.
    // O genérico <T> deixa cada chamador informar o tipo esperado
    // (ex.: getUser<AuthUser>()).
    getUser<T>(): T | null {
        const salvo = localStorage.getItem(USER_KEY);

        // Nada salvo ainda: o usuário simplesmente não está logado.
        if (!salvo) return null;

        // O JSON.parse pode lancar excecao se o valor guardado estiver
        // corrompido (edicao manual no DevTools, versao antiga do app,
        // ou gravacao interrompida). Sem este try/catch, o erro subia
        // para o React e derrubava a aplicacao inteira em tela branca.
        try {
            return JSON.parse(salvo) as T;
        } catch (erro) {
            // Registra o problema no console e apaga o dado inválido,
            // para que a próxima leitura já comece limpa.
            console.error('[authStorage] helpdesk_user invalido no localStorage, descartando.', erro);
            localStorage.removeItem(USER_KEY);
            return null;
        }
    },

    // Atualiza só os dados do usuário, preservando o token.
    // Usado pelo AuthProvider depois de revalidar a sessão com GET /auth/me,
    // para guardar a role mais recente sem pedir um novo token.
    setUser(user: unknown) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Grava token e usuário de uma vez, logo após um login bem-sucedido.
    save(token: string, user: unknown) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Apaga tudo que a sessão gravou. Chamado no logout e sempre que
    // uma requisição volta 401 (token inválido).
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};
