// ============================================
// TELA: PAINEL DO ADMINISTRADOR (/admin)
// ============================================
// Página inicial do perfil ADMIN. Traz duas áreas:
//
// 1. CHAMADOS EM TEMPO REAL
//    Todos os chamados do sistema, atualizados por WebSocket
//    (hooks/useChamadosTempoReal.js conecta em /ws/tickets). Cada criação,
//    edição ou remoção de chamado chega aqui na hora, sem recarregar a tela.
//
// 2. CONVITES
//    Formulário para convidar funcionários por e-mail (e-mail + papel).
//    Quando o funcionário se cadastrar com aquele e-mail, o backend aplica o
//    papel do convite automaticamente e o consome; no próximo login, ele já
//    cai na página do seu perfil.
//
// A rota é "/admin" e exige sessão com role ADMIN (RotaProtegida somenteAdmin
// em App.jsx).

import { useCallback, useMemo, useState } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { useRequisicao } from '../hooks/useRequisicao';
import { useChamadosTempoReal } from '../hooks/useChamadosTempoReal';
import { convidadoService } from '../services/convidadoService';
import { traduzirErroApi } from '../services/erroApi';
import { DetalhesChamado } from '../components/DetalhesChamado';
import {
  contarChamados,
  STATUS_LABEL,
  STATUS_COR,
  formatarData,
} from '../constants/labels';

// Página de administração: chamados em tempo real + convite de funcionários.
export const AdminHome = () => {
  // ----- CHAMADOS EM TEMPO REAL (WebSocket) -----
  const { chamados, conectado } = useChamadosTempoReal();

  // Chamado escolhido para ver os detalhes (null = nenhum).
  const [chamadoDetalhe, setChamadoDetalhe] = useState(null);

  // Filtro ativo da tabela: null = todos. Ao clicar em um bloco de
  // quantitativo, a tabela passa a mostrar só os chamados daquele status
  // (mesma ideia dos cards clicáveis da Home).
  const [filtroStatus, setFiltroStatus] = useState(null);

  // Os contadores são recalculados a cada mensagem que chega pelo socket,
  // então refletem o estado mais recente da fila.
  const contadores = contarChamados(chamados || []);

  // Configuração dos quatro blocos. Cada um sabe o rótulo, o número que
  // exibe e o status que filtra ("todos" = null, sem filtro).
  const blocos = [
    { rotulo: 'Total', total: contadores.total, status: null },
    { rotulo: 'Abertos', total: contadores.pendentes, status: 'ABERTO' },
    { rotulo: 'Em andamento', total: contadores.emAndamento, status: 'EM_ANDAMENTO' },
    { rotulo: 'Concluídos', total: contadores.concluidos, status: 'CONCLUIDO' },
  ];

  // Chamados exibidos na tabela: a lista completa ou apenas o status
  // escolhido no bloco clicado. Recalculado a cada atualização do socket.
  const chamadosFiltrados = useMemo(() => {
    if (!filtroStatus) return chamados || [];

    return (chamados || []).filter((c) => c.status === filtroStatus);
  }, [chamados, filtroStatus]);

  // Rótulo do filtro ativo, usado no cabeçalho da tabela e no botão limpar.
  const rotuloFiltro = blocos.find((b) => b.status === filtroStatus)?.rotulo;

  // ----- CONVITES -----
  const carregarConvites = useCallback(() => convidadoService.listar(), []);
  const { dados: convites, carregando, erro: erroLista, recarregar } =
    useRequisicao(carregarConvites);

  // Estado do formulário de convite.
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState('USUARIO');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Id do convite sendo removido, para travar só aquele botão.
  const [removendoId, setRemovendoId] = useState(null);

  // Cria o convite (e-mail + papel). A pessoa ainda precisa se cadastrar.
  const handleConvidar = async (e) => {
    e.preventDefault();

    setErro('');
    setSucesso('');

    // Validação local rápida; o backend também valida o formato do e-mail.
    if (!email.trim().toLowerCase() || !email.includes('@')) {
      setErro('Informe um e-mail válido.');
      return;
    }

    setEnviando(true);

    try {
      await convidadoService.criar({
        email: email.trim().toLowerCase(),
        role: papel,
      });

      setSucesso(
        `Convite enviado para ${email.trim().toLowerCase()}. ` +
          'O funcionário precisa se cadastrar com este e-mail para ativar o acesso.'
      );
      setEmail('');

      await recarregar();
    } catch (falha) {
      const { texto } = traduzirErroApi(falha, 'criar o convite');
      setErro(texto);
    } finally {
      setEnviando(false);
    }
  };

  // Cancela um convite pendente.
  const removerConvite = async (convite) => {
    setErro('');
    setSucesso('');

    const confirmado = window.confirm(`Cancelar o convite para "${convite.email}"?`);

    if (!confirmado) return;

    setRemovendoId(convite.id);

    try {
      await convidadoService.remover(convite.id);
      setSucesso('Convite cancelado com sucesso.');
      await recarregar();
    } catch (falha) {
      const { texto } = traduzirErroApi(falha, 'cancelar o convite');
      setErro(texto);
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <SidebarLayout>
      {/* Chamados em tempo real */}
      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-5 py-2 rounded-pill fw-bold fs-5">
          Painel Administrativo
        </span>
      </div>

      {/* Estado da conexão websocket: indica se a fila é "ao vivo" agora. */}
      <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
        <span
          className={`badge ${conectado ? 'text-bg-success' : 'text-bg-danger'}`}
        >
          <i className={`bi ${conectado ? 'bi-broadcast' : 'bi-broadcast-pin'} me-1`}></i>
          {conectado ? 'AO VIVO' : 'CONEXÃO CAIU — RECONECTANDO...'}
        </span>
        <small className="text-muted">
          {chamados.length} chamado(s) no sistema
        </small>
      </div>

      {/* Blocos de resumo clicáveis: recalculados a cada mensagem do socket.
          Clicar em um bloco filtra a tabela abaixo; clicar em "Total" (ou no
          bloco já ativo) volta a mostrar todos os chamados. */}
      <div className="row g-3 mb-4 text-center">
        {blocos.map(({ rotulo, total, status }) => {
          const ativo = filtroStatus === status;

          return (
            <div className="col" key={rotulo}>
              <button
                type="button"
                className={`p-3 bg-secondary text-white rounded shadow-sm w-100 h-100 border-0 ${ativo ? 'border border-3 border-warning' : ''}`}
                onClick={() => setFiltroStatus(status)}
                aria-pressed={ativo}
              >
                <h3 className="mb-0">{total}</h3>
                <small>{rotulo}</small>
              </button>
            </div>
          );
        })}
      </div>

      {/* Tabela de chamados, atualizada em tempo real e filtrada pelo bloco
          selecionado acima. */}
      <div className="card p-3 border-secondary shadow-sm mb-4">
        <div className="d-flex justify-content-center align-items-center text-center position-relative mb-3">
          <div>
            <h5 className="fw-bold mb-0">
              <i className="bi bi-clipboard-data me-2"></i>
              {filtroStatus ? `Chamados — ${rotuloFiltro}` : 'Todos os chamados'}
            </h5>
            <small className="text-muted">
              Atualização automática — clique em uma linha para ver os detalhes.
            </small>
          </div>

          {/* Botão para limpar o filtro, visível só quando há um ativo. */}
          {filtroStatus && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill position-absolute end-0"
              onClick={() => setFiltroStatus(null)}
            >
              <i className="bi bi-x-circle me-1"></i> Limpar filtro
            </button>
          )}
        </div>

        {chamadosFiltrados.length === 0 ? (
          <p className="text-center text-muted mb-0">
            {filtroStatus
              ? 'Nenhum chamado neste status.'
              : 'Nenhum chamado aberto no momento.'}
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Id</th>
                  <th>Título</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {chamadosFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setChamadoDetalhe(item)}
                  >
                    <td>{item.id}</td>
                    <td className="fw-bold">{item.titulo}</td>
                    <td>{item.cliente_nome}</td>
                    <td>{item.servico_nome}</td>
                    <td>
                      <span className={`badge ${STATUS_COR[item.status]}`}>
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                    </td>
                    <td>{formatarData(item.data_criacao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convites de funcionários */}
      <div className="card p-3 border-secondary shadow-sm mb-4">
        <div className="d-flex justify-content-center align-items-center text-center position-relative mb-3">
          <div>
            <h5 className="fw-bold mb-0">
              <i className="bi bi-send me-2"></i>
              Convidar funcionário
            </h5>
            <small className="text-muted">
              Defina o e-mail e o perfil; ao se cadastrar, o funcionário já entra com esse perfil.
            </small>
          </div>
        </div>

        {erro && (
          <div className="alert alert-danger py-2 small" role="alert">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="alert alert-success py-2 small" role="alert">
            {sucesso}
          </div>
        )}

        <form onSubmit={handleConvidar} className="mb-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <label className="form-label small fw-bold" htmlFor="convidadoEmail">
                E-mail
              </label>
              <input
                id="convidadoEmail"
                type="email"
                className="form-control form-control-sm"
                placeholder="funcionario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-bold" htmlFor="convidadoPapel">
                Perfil de acesso
              </label>
              <select
                id="convidadoPapel"
                className="form-select form-select-sm"
                value={papel}
                onChange={(e) => setPapel(e.target.value)}
              >
                <option value="USUARIO">Usuário</option>
                <option value="TECNICO">Técnico</option>
              </select>
            </div>

            <div className="col-md-3">
              <button
                type="submit"
                disabled={enviando}
                className="btn btn-secondary btn-sm rounded-pill px-4 fw-bold w-100"
              >
                {enviando ? 'Convidando...' : 'Convidar'}
              </button>
            </div>
          </div>
        </form>

        {carregando && <p className="text-muted small mb-0">Carregando convites...</p>}

        {erroLista && (
          <div className="alert alert-warning py-2 small" role="alert">
            Não foi possível carregar a lista de convites: {erroLista}
          </div>
        )}

        {!carregando && convites?.length === 0 && (
          <p className="text-muted small mb-0">
            Nenhum convite pendente. Use o formulário acima para convidar um funcionário.
          </p>
        )}

        {!carregando && convites?.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Data</th>
                  <th style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {convites.map((convite) => (
                  <tr key={convite.id}>
                    <td>{convite.email}</td>
                    <td>{convite.role === 'TECNICO' ? 'Técnico' : 'Usuário'}</td>
                    <td>{formatarData(convite.data_criacao)}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removerConvite(convite)}
                        disabled={removendoId === convite.id}
                        aria-label={`Cancelar convite de ${convite.email}`}
                      >
                        {removendoId === convite.id ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="bi bi-x-circle"></i>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalhes do chamado clicado na tabela em tempo real. */}
      {chamadoDetalhe && (
        <DetalhesChamado
          chamado={chamadoDetalhe}
          onFechar={() => setChamadoDetalhe(null)}
        />
      )}
    </SidebarLayout>
  );
};