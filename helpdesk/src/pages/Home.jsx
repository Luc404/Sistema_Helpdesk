import { SidebarLayout } from './SidebarLayout';

const services = [
  { title: 'backup', desc: 'Realização de backup nos arquivos sensíveis do usuário', icon: 'bi-hdd' },
  { title: 'Segurança', desc: 'Realização de scanner para detecção de vírus', icon: 'bi-shield-lock' },
  { title: 'Acessórios/periféricos', desc: 'Solicitação de mouse, monitor, teclado e diversos', icon: 'bi-mouse' },
  { title: 'Indisponibilidade do sistema', desc: 'Realização de reinicializar o sistema', icon: 'bi-arrow-clockwise' },
  { title: 'Personalização do sistema', desc: 'Realização de personalizações a pedido do usuário', icon: 'bi-pencil-square' },
  { title: 'Esqueci minha senha', desc: 'Realização de reset de senha de usuário', icon: 'bi-question-circle' },
  { title: 'Criar usuário de rede', desc: 'Realização da criação do usuário de rede', icon: 'bi-person-plus' },
  { title: 'Solicitação de treinamento', desc: 'Realização de treinamento sobre o sistema', icon: 'bi-easel' },
  { title: 'Impressora/scanners', desc: 'Realização de configuração de impressora e scanner', icon: 'bi-printer' },
];

export const Home = () => {
  return (
    <SidebarLayout>
      <div className="row justify-content-center mb-4">
        <div className="col-md-8">
          <div className="input-group input-group-lg rounded-pill border bg-white shadow-sm">
            <span className="input-group-text bg-transparent border-0 pe-0 ms-2">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input type="text" className="form-control border-0 shadow-none ps-3" placeholder="O que você procura" />
          </div>
        </div>
      </div>

      <div className="text-center mb-3">
        <span className="bg-secondary text-white px-4 py-2 rounded-top fw-bold">Chamados</span>
      </div>

      <div className="row g-3 mb-4 text-center">
        <div className="col"><div className="p-3 bg-secondary text-white rounded shadow-sm"><h3>100</h3><small>todos</small></div></div>
        <div className="col"><div className="p-3 bg-secondary text-white rounded shadow-sm"><h3>5</h3><small>Pendentes</small></div></div>
        <div className="col"><div className="p-3 bg-secondary text-white rounded shadow-sm"><h3>20</h3><small>Validar</small></div></div>
        <div className="col"><div className="p-3 bg-secondary text-white rounded shadow-sm"><h3>50</h3><small>Concluidos</small></div></div>
      </div>

      <div className="row g-3">
        {services.map((item, index) => (
          <div key={index} className="col-md-4">
            <div className="card h-100 border shadow-sm">
              <div className="card-header bg-white border-bottom-0 pt-3 d-flex align-items-center justify-content-center">
                <i className={`bi ${item.icon} fs-4 me-2`}></i>
                <span className="fw-bold">{item.title}</span>
              </div>
              <div className="card-body bg-secondary text-white rounded-bottom">
                <p className="card-text small mb-0">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SidebarLayout>
  );
};