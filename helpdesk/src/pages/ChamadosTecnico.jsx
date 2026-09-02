import { SidebarLayout } from './SidebarLayout';

// Dados mockados de chamados atribuídos ao técnico
const chamadosTecnicos = [
  { id: '001', nome: 'Criar um novo usuário', criterio: 'Urgência', status: 'Concluido', data: '29/08/2026', usuario: 'Igor.cardoso' },
  { id: '003', nome: 'Personalizar sistema', criterio: 'Média', status: 'Pendente', data: '01/01/2025', usuario: 'Lucas.Henrique' },
  { id: '004', nome: 'Solicitar treinamento', criterio: 'Baixa', status: 'Pendente', data: '01/01/2025', usuario: 'Italo.costa' },
  { id: '005', nome: 'Segurança', criterio: 'Urgência', status: 'Pendente', data: '01/01/2025', usuario: 'Paulo.vitor' },
  { id: '006', nome: 'Esqueci minha senha', criterio: 'Baixa', status: 'Pendente', data: '01/01/2025', usuario: 'Emilly.vitoria' },
  { id: '007', nome: 'Esqueci minha senha', criterio: 'Urgência', status: 'Pendente', data: '01/01/2025', usuario: 'Sofia.silva' },
  { id: '008', nome: 'Personalizar sistema', criterio: 'Urgência', status: 'Pendente', data: '01/01/2025', usuario: 'Luan.cardoso' },
  { id: '009', nome: 'Back up', criterio: 'Baixa', status: 'Pendente', data: '01/01/2025', usuario: 'Marcos.Dhiego' },
];

// Página de visualização de chamados para o perfil de técnico
export const ChamadosTecnico = () => {
  return (
    <SidebarLayout>
      {/* Título da página */}
      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-5 py-2 rounded-pill fw-bold fs-5">chamados</span>
      </div>

      {/* Cards de resumo com contadores de chamados */}
      <div className="row g-2 mb-3 text-center">
        <div className="col"><div className="p-2 bg-secondary text-white rounded"><h4>75</h4><small>todos</small></div></div>
        <div className="col"><div className="p-2 bg-secondary text-white rounded"><h4>5</h4><small>Pendentes</small></div></div>
        <div className="col"><div className="p-2 bg-secondary text-white rounded"><h4>20</h4><small>Validar</small></div></div>
        <div className="col"><div className="p-2 bg-secondary text-white rounded"><h4>50</h4><small>Concluidos</small></div></div>
      </div>

      {/* Card com tabela de chamados e barra de pesquisa */}
      <div className="card p-3 border-secondary shadow-sm">
        {/* Campo de busca por ID do chamado */}
        <div className="input-group rounded-pill border bg-white mb-3">
          <span className="input-group-text bg-transparent border-0 pe-0 ms-2">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input type="text" className="form-control border-0 shadow-none ps-3" placeholder="Chamados por id" />
        </div>

        {/* Tabela responsiva com lista de chamados */}
        <div className="table-responsive">
          <table className="table table-bordered text-center align-middle">
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
              {chamadosTecnicos.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="fw-bold">{item.nome}</td>
                  <td>{item.criterio}</td>
                  <td>{item.status}</td>
                  <td>{item.data}</td>
                  <td>{item.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação e controle de exibição de linhas */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <select className="form-select form-select-sm" style={{ width: '70px' }}>
            <option>9</option>
          </select>
          <span className="text-muted small">Exibir 1 a 9 linhas</span>
        </div>
      </div>
    </SidebarLayout>
  );
};
