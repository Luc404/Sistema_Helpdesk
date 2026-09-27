import { useCallback, useMemo, useState } from 'react';
import { SidebarLayout } from './SidebarLayout';
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
      await recarregar();    } catch (falha) {
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
