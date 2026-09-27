// ============================================
// HOOK DE REQUISIÇÃO À API
// ============================================
// Encapsula o mesmo padrão que se repetiria em todas as páginas:
//
//   1. chama uma função que devolve uma Promise (normalmente um service);
//   2. guarda o resultado em "dados";
//   3. controla "carregando" e "erro";
//   4. ignora a resposta se o componente foi desmontado antes dela chegar
//      (evita o aviso "setState on unmounted component" ao trocar de página
//      rápido enquanto a requisição ainda está em voo).

import { useEffect, useState } from 'react';

// Extrai a mensagem de erro vinda do backend.
// O FastAPI sempre responde erros no campo "detail", então é sempre
// melhor mostrar isso ao usuário do que um "erro genérico".
export function extrairErro(erro) {
  return erro?.response?.data?.detail || 'Não foi possível completar a operação.';
}

// "carregar" é a função que busca os dados (ex.: () => servicoService.listar()).
// IMPORTANTE: ela precisa ser estável entre renders, ou seja, criada com
// useCallback(..., []). Se a página passar uma função recriada a cada render,
// o efeito abaixo dispara sem parar. Todas as páginas do projeto já fazem
// useCallback, então o contrato é respeitado.
//
// O array "dependencias" funciona como o "useEffect" do React: quando o
// conteúdo mudar, os dados são buscados de novo.
export function useRequisicao(carregar, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Busca os dados sob demanda. É devolvida como "recarregar" e pode ser
  // chamada de um event handler (ex.: depois de um POST, para a tabela
  // exibir o registro novo sem recarregar a página inteira).
  const recarregar = async () => {
    setCarregando(true);
    setErro('');

    try {
      const resultado = await carregar();

      setDados(resultado);
      return resultado;
    } catch (falha) {
      setErro(extrairErro(falha));
      return null;
    } finally {
      setCarregando(false);
    }
  };

  // Carga inicial. Diferente de "recarregar", esta versão ignora a resposta
  // se o usuário já saiu da tela antes da requisição terminar.
  //
  // ----- POR QUE EXISTE A CHAVE DEPENDENCIAS ABAIXO -----
  // O "dependencias" chega aqui como um array recriado a cada render: quando
  // a página chama useRequisicao(carregarChamados) sem o segundo argumento,
  // o valor padrão `= []` cria um array novo a cada render. O useEffect
  // compara dependências com Object.is, ou seja, por REFERÊNCIA — dois
  // arrays vazios sãoconsidered diferentes. O efeito rodava a cada render,
  // o setDados forçava um novo render, e a busca recomeçava: um loop
  // infinito de GET. No terminal isso aparece como "um monte de GET".
  //
  // Serializar o conteúdo transforma a dependência em uma STRING, que o
  // React compara por valor. Assim o efeito só dispara quando as
  // dependências mudam de verdade.
  const chaveDependencias = JSON.stringify(dependencias);

  useEffect(() => {
    let cancelado = false;

    const buscar = async () => {
      try {
        const resultado = await carregar();

        if (!cancelado) setDados(resultado);
      } catch (falha) {
        if (!cancelado) setErro(extrairErro(falha));
      } finally {
        if (!cancelado) setCarregando(false);
      }
    };

    buscar();

    // Função de limpeza: o React chama quando a página é desmontada.
    return () => {
      cancelado = true;
    };
    // "carregar" precisa entrar na lista. Todas as páginas o criam com
    // useCallback(..., []), então a referência é estável e não causa loop.
  }, [carregar, chaveDependencias]);

  return { dados, carregando, erro, recarregar };
}
