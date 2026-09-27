import { useCallback, useMemo, useState } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { useRequisicao } from '../hooks/useRequisicao';
import { servicoService } from '../services/servicoService';
import { chamadoService } from '../services/chamadoService';
import { contarChamados } from '../constants/labels';

// Página principal do sistema (dashboard) com visão geral dos chamados e serviços
export const Home = () => {
  // Texto do campo de pesquisa. Filtra os cards de serviço por nome.
  const [busca, setBusca] = useState('');

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

      {/* Cards de resumo com contadores de status dos chamados */}
      <div className="row g-3 mb-4 text-center">
        <div className="col">
          <div className="p-3 bg-secondary text-white rounded shadow-sm">
            <h3>{carregandoChamados ? '...' : contadores.total}</h3>
            <small>todos</small>
          </div>
        </div>
        <div className="col">
          <div className="p-3 bg-secondary text-white rounded shadow-sm">
            <h3>{carregandoChamados ? '...' : contadores.pendentes}</h3>
            <small>Abertos</small>
          </div>
        </div>
        <div className="col">
          <div className="p-3 bg-secondary text-white rounded shadow-sm">
            <h3>{carregandoChamados ? '...' : contadores.emAndamento}</h3>
            <small>Em andamento</small>
          </div>
        </div>
        <div className="col">
          <div className="p-3 bg-secondary text-white rounded shadow-sm">
            <h3>{carregandoChamados ? '...' : contadores.concluidos}</h3>
            <small>Concluídos</small>
          </div>
        </div>
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
    </SidebarLayout>
  );
};
