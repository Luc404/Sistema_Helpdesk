// ============================================
// TELA: HOME (dashboard)
// ============================================
// Página inicial de quem está logado. Mostra o catálogo de serviços
// (com busca por nome) e quatro contadores de chamados calculados a
// partir da lista que o usuário pode ver.
//
// Os quatro contadores são clicáveis: ao clicar em "Abertos", por
// exemplo, abre um modal com a lista dos chamados com status ABERTO.
// De lá, o botão de olho abre os detalhes do chamado (DetalhesChamado).
//
// A API não tem endpoint de estatísticas, então a contagem por status
// acontece no navegador, em contarChamados (constants/labels.js). Da
// mesma forma, a API não aceita ?limit / ?offset, então não há
// paginação de verdade: as páginas de chamado cortam a lista no
// navegador (veja TAMANHO_PAGINA em MeusChamdadosUsuario.jsx).

import { useCallback, useMemo, useState } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { useRequisicao } from '../hooks/useRequisicao';
import { servicoService } from '../services/servicoService';
import { chamadoService } from '../services/chamadoService';
import { Modal } from '../components/Modal';
import { DetalhesChamado } from '../components/DetalhesChamado';
import {
  contarChamados,
  STATUS_LABEL,
  STATUS_COR,
  formatarData,
} from '../constants/labels';

// Página principal do sistema (dashboard) com visão geral dos chamados e serviços
export const Home = () => {
  // Texto do campo de pesquisa. Filtra os cards de serviço por nome.
  const [busca, setBusca] = useState('');

  // Grupo de chamados aberto no modal (null = nenhum). Guarda o rótulo e
  // a função de filtro do card clicado, por exemplo { rotulo: 'Abertos',
  // filtrar: (c) => c.status === 'ABERTO' }.
  const [grupoAberto, setGrupoAberto] = useState(null);

  // Chamado escolhido para ver os detalhes (null = nenhum).
  const [chamadoDetalhe, setChamadoDetalhe] = useState(null);

  // Busca os cards de serviço. "/servicos/" é rota pública na API.
  // useCallback impede que a função seja recriada a cada render, o que
  // dispararia nova requisição em laço.
  const carregarServicos = useCallback(() => servicoService.listar(), []);
  const { dados: servicos, carregando: carregandoServicos, erro: erroServicos } =
    useRequisicao(carregarServicos);

  // Busca os chamados só para alimentar os quatro contadores.
  const carregarChamados = useCallback(() => chamadoService.listar(), []);
  const { dados: chamados, carregando: carregandoChamados, erro: erroChamados } =
    useRequisicao(carregarChamados);

  // Aplica o filtro da pesquisa sobre a lista de serviços.
  // useMemo evita refiltrar a lista a cada tecla digitada no campo de busca.
  const servicosFiltrados = useMemo(() => {
    if (!servicos) return [];

    const termo = busca.trim().toLowerCase();

    if (!termo) return servicos;

    return servicos.filter((s) => s.nome.toLowerCase().includes(termo));
  }, [servicos, busca]);

  // Os contadores saem da lista de chamados: a API não tem endpoint de
  // estatísticas, então a contagem por status é feita no navegador.
  const contadores = useMemo(() => contarChamados(chamados || []), [chamados]);

  // Configuração dos quatro cards. Cada um sabe o rótulo, o número que
  // exibe e como filtrar a lista quando clicado ("todos" não filtra nada).
  const cards = [
    { rotulo: 'todos', total: contadores.total, filtrar: () => true },
    { rotulo: 'Abertos', total: contadores.pendentes, filtrar: (c) => c.status === 'ABERTO' },
    { rotulo: 'Em andamento', total: contadores.emAndamento, filtrar: (c) => c.status === 'EM_ANDAMENTO' },
    { rotulo: 'Concluídos', total: contadores.concluidos, filtrar: (c) => c.status === 'CONCLUIDO' },
  ];

  // Chamados que pertencem ao grupo aberto no momento.
  const chamadosDoGrupo = useMemo(() => {
    if (!grupoAberto) return [];

    return (chamados || []).filter(grupoAberto.filtrar);
  }, [chamados, grupoAberto]);

  return (
    <SidebarLayout>
      {/* Barra de pesquisa global */}
      <div className="row justify-content-center mb-4">
        <div className="col-md-8">
          <div className="input-group input-group-lg rounded-pill border bg-white shadow-sm">
            <span className="input-group-text bg-transparent border-0 pe-0 ms-2">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 shadow-none ps-3"
              placeholder="O que você procura"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Título da seção de chamados */}
      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-4 py-2 rounded-top fw-bold">Chamados</span>
      </div>

      {/* Cards de resumo com contadores de status dos chamados.
          Cada card é um botão: clicar nele abre o modal com os chamados
          daquele status (a lista é filtrada mais abaixo). */}
      <div className="row g-3 mb-4 text-center">
        {cards.map(({ rotulo, total, filtrar }) => (
          <div className="col" key={rotulo}>
            <button
              type="button"
              className="p-3 bg-secondary text-white rounded shadow-sm w-100 h-100 border-0"
              onClick={() => {
                // Fecha um detalhe que estivesse aberto antes de trocar de grupo.
                setChamadoDetalhe(null);
                setGrupoAberto({ rotulo, filtrar });
              }}
            >
              <h3 className="mb-0">{carregandoChamados ? '...' : total}</h3>
              <small>{rotulo}</small>
            </button>
          </div>
        ))}
      </div>

      {/* Mensagem de erro caso a lista de chamados não carregue */}
      {erroChamados && (
        <div className="alert alert-danger py-2 small" role="alert">
          {erroChamados}
        </div>
      )}

      {/* Grid de cards com os serviços disponíveis */}
      {carregandoServicos && (
        <p className="text-center text-muted">Carregando serviços...</p>
      )}

      {erroServicos && (
        <div className="alert alert-danger py-2 small" role="alert">
          {erroServicos}
        </div>
      )}

      {!carregandoServicos && !erroServicos && servicosFiltrados.length === 0 && (
        <p className="text-center text-muted">Nenhum serviço encontrado.</p>
      )}

      <div className="row g-3">
        {servicosFiltrados.map((servico) => (
          <div key={servico.id} className="col-md-4">
            <div className="card h-100 border shadow-sm">
              {/* Cabeçalho do card com ícone e título do serviço.
                  O "icone" vem do banco e já é o nome de uma classe
                  do Bootstrap Icons (ex.: "bi-easel"). */}
              <div className="card-header bg-white border-bottom-0 pt-3 d-flex align-items-center justify-content-center">
                <i className={`bi ${servico.icone || 'bi-tools'} fs-4 me-2`}></i>
                <span className="fw-bold">{servico.nome}</span>
              </div>
              {/* Corpo do card com descrição do serviço */}
              <div className="card-body bg-secondary text-white rounded-bottom">
                <p className="card-text small mb-0">{servico.descricao}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal com a lista de chamados do grupo clicado.
          Só aparece quando um grupo está aberto e nenhum detalhe foi
          escolhido — assim, fechar os detalhes volta para esta lista. */}
      {!chamadoDetalhe && grupoAberto && (
        <Modal titulo={`Chamados — ${grupoAberto.rotulo}`} onFechar={() => setGrupoAberto(null)}>
          {chamadosDoGrupo.length === 0 ? (
            <p className="text-center text-muted mb-0">Nenhum chamado neste grupo.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Id</th>
                    <th>Título</th>
                    <th>Serviço</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {chamadosDoGrupo.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="fw-bold">{item.titulo}</td>
                      <td>{item.servico_nome}</td>
                      <td>
                        <span className={`badge ${STATUS_COR[item.status]}`}>
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </td>
                      <td>{formatarData(item.data_criacao)}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setChamadoDetalhe(item)}
                          aria-label={`Ver detalhes do chamado ${item.id}`}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* Modal com os detalhes do chamado escolhido na lista acima.
          Recebe os dados já carregados: não gasta nova requisição. */}
      {chamadoDetalhe && (
        <DetalhesChamado
          chamado={chamadoDetalhe}
          onFechar={() => setChamadoDetalhe(null)}
        />
      )}
    </SidebarLayout>
  );
};
