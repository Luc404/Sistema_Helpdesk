// ============================================
// TELA: CHAMADOS (perfil TÉCNICO)
// ============================================
// Área de trabalho do técnico. Tem duas partes:
//   1. A FILA DE CHAMADOS (sempre visível)
//      Mostra todos os chamados e permite mudar o status de qualquer um
//      deles. Usa GET /tickets/detalhes, que já devolve os nomes
//      ("servico_nome", "cliente_nome", "unidade_nome") prontos — não é
//      preciso cruzar ids no frontend.
//
//      O <select> de status dispara PUT /tickets/{id}, restrito ao perfil
//      TÉCNICO no backend. Se a chamada voltar 403, a mensagem do FastAPI
//      aparece no alert de erro.
//
//   2. O GERENCIAMENTO DE SERVIÇOS (bloco expansível)
//      Formulário para o técnico cadastrar, editar e remover os serviços
//      de suporte. Fica recolhido por padrão para não competir com a fila
//      de atendimento, que é o trabalho do dia a dia. O conteúdo está em
//      components/GerenciarServicos.jsx.
//
// A rota é "/chamados" e exige sessão com role TECNICO (ver RotaProtegida
// somenteTecnico em App.jsx). Aceita "?secao=servicos" para abrir já no
// gerenciador de serviços — é o que o link "Serviços" da sidebar usa.

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SidebarLayout } from './SidebarLayout';
import { GerenciarServicos } from '../components/GerenciarServicos';
import { useRequisicao } from '../hooks/useRequisicao';
import { chamadoService } from '../services/chamadoService';
import { STATUS_LABEL, STATUS_COR, PRIORIDADE_LABEL, formatarData } from '../constants/labels';

// Quantas linhas a tabela exibe por página (controle "Exibir N por página").
const TAMANHO_PAGINA = 9;

// Página de visualização de chamados para o perfil de técnico
export const ChamadosTecnico = () => {
  // Texto da busca por id do chamado.
  const [busca, setBusca] = useState('');

  // Id do chamado que está sendo atualizado, para travar apenas a linha
  // afetada enquanto o PUT /tickets/{id} está em andamento.
  const [salvandoId, setSalvandoId] = useState(null);

  // Mensagem de erro da última ação (ex.: 403 ao tentar mudar o status).
  const [erroAcao, setErroAcao] = useState('');

  // Controla se o bloco de gerenciamento de serviços está expandido.
  //
  // O valor inicial vem da query string: chegar em "/chamados?secao=servicos"
  // (link "Serviços" da sidebar) abre o bloco já expandido. A query é lida
  // uma única vez, na montagem — depois o técnico abre e fecha pelo botão,
  // sem que a URL fique reescrevendo a cada clique.
  const [parametros] = useSearchParams();
  const [mostrarServicos, setMostrarServicos] = useState(
    () => parametros.get('secao') === 'servicos'
  );

  // O técnico enxerga todos os chamados, então uma única requisição basta.
  // "recarregar" é usada depois de cada mudança de status para reexibir a lista.
  const carregarChamados = useCallback(() => chamadoService.listar(), []);
  const { dados: chamados, carregando, erro, recarregar } = useRequisicao(carregarChamados);

  // Filtra por id. A busca é feita sobre o id, como diz o placeholder.
  const chamadosFiltrados = useMemo(() => {
    if (!chamados) return [];

    const termo = busca.trim();

    if (!termo) return chamados;

    return chamados.filter((c) => String(c.id).includes(termo));
  }, [chamados, busca]);

  // Paginação feita no navegador: a API não aceita ?limit / ?offset.
  // ATENÇÃO: enquanto não houver botões de navegação, apenas as
  // TAMANHO_PAGINA primeiras linhas são exibidas.
  const paginaAtual = chamadosFiltrados.slice(0, TAMANHO_PAGINA);

  // Altera o status de um chamado.
  // PUT /tickets/{id} é restrito ao perfil TÉCNICO no backend
  // (app/routers/ticket_router.py). O corpo envia só o campo "status",
  // porque o TicketUpdate é um update parcial.
  const alterarStatus = async (chamado, novoStatus) => {
    setErroAcao('');
    setSalvandoId(chamado.id);

    try {
      await chamadoService.atualizar(chamado.id, { status: novoStatus });

      // Reexibe a lista já com o status novo, sem recarregar a página.
      await recarregar();
    } catch (falha) {
      // O FastAPI manda a explicação no campo "detail" (ex.: 403 sem permissão).
      setErroAcao(falha?.response?.data?.detail || 'Não foi possível atualizar o chamado.');
    } finally {
      // Libera o <select> desta linha para voltar a ser editável.
      setSalvandoId(null);
    }
  };

  return (
    <SidebarLayout>
      {/* Título da página */}
      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-5 py-2 rounded-pill fw-bold fs-5">chamados</span>
      </div>

      {/* Botão que abre/fecha o gerenciamento de serviços.
          Fica logo acima do card da fila para o técnico achar rápido,
          sem precisar descer até o fim da página. */}
      <div className="d-flex justify-content-end mb-2">
        <button
          type="button"
          className="btn btn-outline-secondary rounded-pill fw-bold"
          onClick={() => setMostrarServicos((aberto) => !aberto)}
          aria-expanded={mostrarServicos}
          aria-controls="area-servicos"
        >
          {/* A seta gira conforme o estado, indicando abrir ou fechar. */}
          <i className={`bi ${mostrarServicos ? 'bi-chevron-up' : 'bi-chevron-down'} me-2`}></i>
          {mostrarServicos ? 'Ocultar serviços' : 'Gerenciar serviços'}
        </button>
      </div>

      {/* Bloco de cadastro/edição/remoção de serviços.
          Só é montado quando está expandido, para não gastar uma
          requisição a GET /servicos/ em quem nunca abre o formulário. */}
      {mostrarServicos && (
        <div id="area-servicos">
          <GerenciarServicos />
        </div>
      )}

      {/* Card com tabela de chamados e barra de pesquisa */}
      <div className="card p-3 border-secondary shadow-sm">
        {/* Campo de busca por ID do chamado */}
        <div className="input-group rounded-pill border bg-white mb-3">
          <span className="input-group-text bg-transparent border-0 pe-0 ms-2">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control border-0 shadow-none ps-3"
            placeholder="Chamados por id"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Feedback de carregamento e erro da carga da lista */}
        {carregando && <p className="text-center text-muted mb-2">Carregando chamados...</p>}

        {erro && (
          <div className="alert alert-danger py-2 small" role="alert">
            {erro}
          </div>
        )}

        {erroAcao && (
          <div className="alert alert-danger py-2 small" role="alert">
            {erroAcao}
          </div>
        )}

        {/* Tabela responsiva com lista de chamados.
            Os campos "servico_nome", "cliente_nome" e "unidade_nome" já vêm
            preenchidos pela rota /tickets/detalhes — não é preciso cruzar ids. */}
        <div className="table-responsive">
          <table className="table table-bordered text-center align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Id</th>
                <th>Nome</th>
                <th>Critério</th>
                <th>Status</th>
                <th>Data</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {/* Renderiza cada chamado como uma linha da tabela */}
              {paginaAtual.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="fw-bold">{item.servico_nome}</td>
                  <td>{PRIORIDADE_LABEL[item.prioridade] || item.prioridade}</td>
                  {/* O <select> permite ao técnico mudar o status, o que
                      dispara o PUT /tickets/{id}. Fica desabilitado enquanto
                      a requisição daquela linha está em andamento. */}
                  <td>
                    <select
                      className={`form-select form-select-sm w-auto mx-auto ${STATUS_COR[item.status]}`}
                      value={item.status}
                      disabled={salvandoId === item.id}
                      onChange={(e) => alterarStatus(item, e.target.value)}
                      aria-label={`Status do chamado ${item.id}`}
                    >
                      {Object.entries(STATUS_LABEL).map(([valor, rotulo]) => (
                        <option key={valor} value={valor}>
                          {rotulo}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatarData(item.data_criacao)}</td>
                  <td>{item.cliente_nome}</td>
                </tr>
              ))}

              {/* Linha exibida quando a busca não encontra nenhum chamado */}
              {!carregando && paginaAtual.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted">
                    Nenhum chamado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação e controle de exibição de linhas */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <span className="text-muted small">
            Exibir {paginaAtual.length} a {chamadosFiltrados.length} linhas
          </span>
        </div>
      </div>
    </SidebarLayout>
  );
};
