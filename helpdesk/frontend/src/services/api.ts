// ============================================
// PONTE DE COMUNICAÇÃO COM O BACKEND (axios)
// ============================================
// Todas as chamadas HTTP do frontend passam por esta instância do axios.
// Nenhuma página chama a API direto: as páginas usam os services
// (authService, chamadoService...), que por sua vez usam o "api" daqui.
//
// Três responsabilidades deste arquivo:
//   1. Definir o endereço base da API e um tempo limite de espera.
//   2. Anexar o token do usuário logado em TODA requisição.
//   3. Encerrar a sessão automaticamente quando o token expira.

import axios from 'axios';
import { authStorage } from './authStorage';

// Instância do axios compartilhada por todos os services.
export const api = axios.create({
    // Endereço IPv4 explícito de propósito.
    //
    // O "localhost" NÃO deve ser usado aqui: o Chrome resolve "localhost"
    // para "::1" (IPv6) antes de tentar o IPv4, mas o uvicorn só escuta em
    // 127.0.0.1. O resultado é uma conexão recusada que aparece no navegador
    // como "Failed to fetch" / "Network Error", sem resposta do servidor —
    // por isso a tela mostrava apenas "Não foi possível criar a conta".
    // Escrever o IP na mesma familia do servidor elimina a resolucao.
    baseURL: 'http://127.0.0.1:8000',

    // Sem timeout, uma conexao que fica pendurada (firewall, IP errado,
    // servidor travado) trava o botao em "Criando..." para sempre e nao
    // devolve erro nenhum. 10s e tempo suficiente para uma API local.
    timeout: 10000,
});

// ------------------------------------------------------------------
// INTERCEPTOR DE REQUISIÇÃO
// Roda ANTES de cada chamada sair para a rede. Sua função é injetar o
// header "Authorization", que é como o backend identifica o usuário
// logado nas rotas protegidas (app/dependencies.py → get_current_user).
// ------------------------------------------------------------------
api.interceptors.request.use((config) => {
    // Lê o token guardado no localStorage pelo login.
    const token = authStorage.getToken();

    // Só anexa o header se houver token (rotas públicas não precisam).
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ------------------------------------------------------------------
// INTERCEPTOR DE RESPOSTA
// Roda depois de cada chamada. A forma "use(onOk, onErro)" permite tratar
// o sucesso e o erro em funções separadas; aqui só interessa o erro.
// ------------------------------------------------------------------
// Token expirado ou inválido: descarta a sessão local e volta para o login
api.interceptors.response.use(
    // Sucesso: devolve a resposta intacta, sem alterar nada.
    (response) => response,

    // Erro: o axios sempre rejeita a promise neste segundo parâmetro.
    (error) => {
        // 401 = token ausente, expirado ou assinatura inválida.
        // A checagem do caminho evita redirecionar para "/" quando o
        // usuário já está na tela de login (o erro viria do próprio login).
        if (error.response?.status === 401 && window.location.pathname !== '/') {
            authStorage.clear();
            window.location.assign('/');
        }

        // Repassa o erro para o chamador, que o traduz com traduzirErroApi.
        return Promise.reject(error);
    },
);
