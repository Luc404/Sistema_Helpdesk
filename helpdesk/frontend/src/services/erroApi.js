// ------------------------------------------------------------------
// Tradutor de erros da API para mensagens uteis ao usuario final.
//
// Motivo deste arquivo: antes, o catch das paginas fazia apenas
//     falha?.response?.data?.detail || 'Nao foi possivel ...'
// Quando a requisicao nem chegava no servidor (erro de rede), o objeto
// axios NAO tem a propriedade "response". O resultado era sempre a frase
// generica, sem nenhuma pista do motivo real, e nada aparecia no console
// porque o erro era descartado silenciosamente.
//
// Aqui separamos os dois cenarios que se confundiam:
//   1. O servidor respondeu (existe "response") -> mostramos o "detail"
//      que o FastAPI mandou, incluindo os campos invalidos do 422.
//   2. O servidor NAO respondeu (nao existe "response") -> mostramos que
//      a conexao nem saiu do navegador e em qual URL ela tentou sair.
//   3. Nem chegou a ser uma requisicao (TypeError de programacao) ->
//      o defeito esta no nosso codigo, nao no servidor.
// ------------------------------------------------------------------

import axios from 'axios';

// Nomes dos campos do backend traduzidos para rotulos que o usuario conhece
const ROTULOS_CAMPO = {
    nome: 'nome',
    email: 'e-mail',
    senha: 'senha',
    data_nascimento: 'data de nascimento',
    role: 'perfil de acesso',
    status: 'situacao',
    unidade_id: 'unidade',
};

// Monta a lista de campos recusados pelo validador do FastAPI (status 422)
// O formato bruto e: [{ loc: ['body', 'senha'], msg: 'Field required' }]
function traduzirDetalheArray(detalhe) {
    return detalhe
        .map((item) => {
            // O ultimo item do "loc" e o nome do campo (ex.: 'body', 'senha')
            const campo = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : item.loc;
            const rotulo = ROTULOS_CAMPO[campo] || campo;
            return `${rotulo}: ${item.msg}`;
        })
        .join(' | ');
}

// Escolhe a mensagem final de acordo com o codigo HTTP devolvido
function mensagemPorStatus(status, detalhe) {
    switch (status) {
        case 400:
            return detalhe || 'Requisicao recusada pelo servidor.';
        case 401:
            return 'Sua sessao expirou. Faca login novamente.';
        case 403:
            return detalhe || 'Voce nao tem permissao para executar esta acao.';
        case 404:
            return 'Endpoint nao encontrado. O backend pode estar com uma versao antiga rodando.';
        case 409:
            return detalhe || 'Ja existe um cadastro com este e-mail.';
        case 422:
            return detalhe
                ? `Dados invalidos -> ${detalhe}`
                : 'Dados invalidos. Revise os campos preenchidos.';
        case 500:
            return 'Erro interno no servidor. Veja o terminal do backend para o detalhe.';
        default:
            return detalhe || `Erro ${status} ao falar com o servidor.`;
    }
}

// Funcao principal-exportada pelas paginas
//
// Recebe o erro lançado pelo axios e devolve:
//   { texto, mostrarDetalhe, url, status }
// - texto          : mensagem pronta para exibir na tela
// - mostrarDetalhe : texto tecnico para o console do navegador
// - url            : URL que a aplicacao tentou chamar
// - status         : codigo HTTP, ou null quando a conexao falhou
export function traduzirErroApi(erro, acao = 'a operacao') {
    // Imprime o erro completo no console do navegador.
    // Este log e intencional: sem ele, falhas de rede ficam invisiveis.
    console.error(`[API] Falha ao tentar ${acao}:`, erro);

    // Monta o endereco chamado, para o usuario poder conferir na hora
    const url = erro?.config?.url ? `${erro.config.baseURL || ''}${erro.config.url}` : 'URL desconhecida';

    // ----- CENARIO 1: o servidor respondeu -----
    if (erro?.response) {
        const { status, data } = erro.response;
        const bruto = data?.detail;

        // O FastAPI manda "detail" como texto em erros normais
        // e como lista de objetos nos erros de validacao (422).
        let detalhe = null;
        if (typeof bruto === 'string') {
            detalhe = bruto;
        } else if (Array.isArray(bruto)) {
            detalhe = traduzirDetalheArray(bruto);
        }

        return {
            texto: mensagemPorStatus(status, detalhe),
            mostrarDetalhe: `HTTP ${status} em ${url} - ${JSON.stringify(data)}`,
            url,
            status,
        };
    }

    // ----- CENARIO 2: a conexao nem chegou no servidor -----
    // Só vale esta hipótese se o erro realmente veio do axios.
    // Um TypeError de programação (ex.: chamar um método que não existe)
    // também não tem "response", mas NÃO é problema de rede — tratá-lo
    // como rede manda o diagnóstico para o lado errado.
    if (!axios.isAxiosError(erro)) {
        return {
            texto: 'Erro interno do aplicativo. Veja o console para o detalhe.',
            mostrarDetalhe: `ERRO DE CODIGO (nao e falha de rede) | ${erro?.name}: ${erro?.message} | ${erro?.stack}`,
            url: 'nenhuma requisicao foi enviada',
            status: null,
        };
    }

    // Não existe "response". Pode ser: backend parado, endereço/porta
    // errados, problema de IPv4/IPv6 ou bloqueio de CORS no navegador.
    const codigo = erro?.code || 'sem codigo';
    const mensagemOriginal = erro?.message || 'sem mensagem';

    return {
        texto:
            `Nao foi possivel conectar ao servidor para ${acao}. ` +
            `Confirme que o backend esta rodando em 127.0.0.1:8000.`,
        mostrarDetalhe:
            `SEM RESPOSTA DO SERVIDOR | url=${url} | code=${codigo} | ` +
            `message=${mensagemOriginal} | detalhe=${JSON.stringify(erro)}`,
        url,
        status: null,
    };
}
