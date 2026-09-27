import { useCallback, useMemo, useState } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { useRequisicao } from '../hooks/useRequisicao';
import { chamadoService } from '../services/chamadoService';
import { STATUS_LABEL, STATUS_COR, formatarData } from '../constants/labels';

// Quantas linhas a tabela exibe por vez (a API não faz paginação).
const TAMANHO_PAGINA = 9;

// Página de visualização dos chamados do usuário logado
export const MeusChamadosUsuario = () => {
  // Texto da busca por título de chamado.
  const [busca, setBusca] = useState('');

  // Uma única chamada já traz o que o usuário pode ver: o backend
  // (ticket_service.query_visiveis) devolve os chamados que ele abriu
  // E os que ele está em cópia. Filtrar por "cliente_id" no frontend
  // esconderia justamente os chamados em cópia, então não é feito.
  const carregarChamados = useCallback(() => chamadoService.listar(), []);
  const { dados: chamados, carregando, erro } = useRequisicao(carregarChamados);

  // Filtra a lista pelo título digitado na busca.
  const chamadosFiltrados = useMemo(() => {
    if (!chamados) return [];

    const termo = busca.trim().toLowerCase();

    if (!termo) return chamados;

    return chamados.filter((c) => c.titulo.toLowerCase().includes(termo));
  }, [chamados, busca]);

  // Paginação feita no navegador: a API não aceita ?limit / ?offset,
  // então o corte da lista acontece aqui, no React.
  // ATENÇÃO: enquanto não houver botões de navegação, apenas as
  // TAMANHO_PAGINA primeiras linhas são exibidas.
  const paginaAtual = chamadosFiltrados.slice(0, TAMANHO_PAGINA);

  return (
    <SidebarLayout>
      {/* Título da página */}
      <div className="text-center mb-4">
        <span className="bg-secondary text-white px-5 py-2 rounded-pill fw-bold fs-5">Meus chamados</span>
      </div>

      {/* Card com barra de pesquisa e tabela de chamados */}
      <div className="card p-3 border-secondary shadow-sm">
        {/* Campo de busca */}
        <div className="mb-3">
          <div className="input-group rounded-pill border bg-white">
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

        {carregando && <p className="text-center text-muted mb-2">Carregando chamados...</p>}

        {erro && (
          <div className="alert alert-danger py-2 small" role="alert">
            {erro}
          </div>
        )}

        {/* Tabela responsiva com lista de chamados do usuário */}
        <div className="table-responsive">
          <table className="table table-bordered text-center align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Id</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Data</th>
                <th>Unidade</th>
              </tr>
            </thead>
            <tbody>
              {/* Renderiza cada chamado como uma linha da tabela.
                  O status é somente leitura aqui: alterar exigiria o perfil
                  TÉCNICO (o PUT /tickets/{id} devolve 403 para usuário comum). */}
              {paginaAtual.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="fw-bold">{item.titulo}</td>
                  <td>
                    <span className={`badge ${STATUS_COR[item.status]}`}>
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                  </td>
                  <td>{formatarData(item.data_criacao)}</td>
                  <td>{item.unidade_nome}</td>
                </tr>
              ))}

              {!carregando && paginaAtual.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted">
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
