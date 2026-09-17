import { SidebarLayout } from './SidebarLayout';

// Dados mockados dos chamados do usuário
const chamados = [
  { id: '001', nome: 'Criar um novo usuário', status: 'Concluido', data: '29/08/2026', unidade: 'matriz' },
  { id: '002', nome: 'Personalizar sistema', status: 'Pendente', data: '01/01/2025', unidade: 'matriz' },
  { id: '003', nome: 'Solicitação de treinamento', status: 'Concluido', data: '07/09/2025', unidade: 'matriz' },
  { id: '004', nome: 'Segurança', status: 'Pendente', data: '04/04/2026', unidade: 'matriz' },
];

// Página de visualização dos chamados do usuário logado
export const MeusChamadosUsuario = () => {
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
            <input type="text" className="form-control border-0 shadow-none ps-3" placeholder="O que você procura" />
          </div>
        </div>

        {/* Tabela responsiva com lista de chamados do usuário */}
        <div className="table-responsive">
          <table className="table table-bordered text-center align-middle">
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
              {/* Renderiza cada chamado como uma linha da tabela */}
              {chamados.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="fw-bold">{item.nome}</td>
                  <td>{item.status}</td>
                  <td>{item.data}</td>
                  <td>{item.unidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação e controle de exibição de linhas */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="d-flex align-items-center">
            <select className="form-select form-select-sm me-2" style={{ width: '70px' }}>
              <option>4</option>
            </select>
          </div>
          <span className="text-muted small">Exibir 1 a 4 linhas</span>
        </div>
      </div>
    </SidebarLayout>
  );
};
