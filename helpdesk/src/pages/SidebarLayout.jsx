import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/auth-context';
import logoImg from '../assets/logo.png';
import helpdeskImg from '../assets/helpdesk.png';

export const SidebarLayout = ({ children, userType = 'Usuário' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  useEffect(() => {
    if (!usuario) {
      navigate('/');
    }
  }, [usuario, navigate]);

  if (!usuario) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar Fixo */}
      <div className="d-flex flex-column bg-secondary text-white p-3" style={{ width: '240px' }}>
        <div className="text-center mb-4">
          <img src={logoImg} alt="The Robbins Logo" className="img-fluid mb-2" style={{ maxHeight: '50px' }} />
          <h5 className="fw-bold m-0">THE ROBBINS</h5>
          <small className="text-light fs-7 d-block">SOFTWARE AS A SERVICE</small>
        </div>

        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <Link to="/home" className={`nav-link text-white ${location.pathname === '/home' ? 'active bg-dark' : ''}`}>
              <i className="bi bi-house-door me-2 fs-5"></i> Home
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/meus-chamados" className={`nav-link text-white ${location.pathname.includes('chamados') ? 'active bg-dark' : ''}`}>
              <i className="bi bi-headset me-2 fs-5"></i> Meus chamados
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link to="/criar-chamado" className={`nav-link text-white ${location.pathname === '/criar-chamado' ? 'active bg-dark' : ''}`}>
              <i className="bi bi-plus-square me-2 fs-5"></i> Novo chamado
            </Link>
          </li>
        </ul>

        <div className="text-center my-3">
          <img src={helpdeskImg} alt="Help Desk Support" className="img-fluid" style={{ maxHeight: '90px' }} />
        </div>

        <div className="mt-auto border-top pt-2">
          <Link to="/sobre" className="nav-link text-white">
            <i className="bi bi-info-circle me-2"></i> Sobre
          </Link>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-grow-1 d-flex flex-column overflow-auto">
        <header className="d-flex justify-content-end align-items-center p-3 bg-white border-bottom shadow-sm">
          <div className="text-end me-2">
            <small className="d-block text-muted">perfil</small>
            <strong className="text-dark">{userType}</strong>
          </div>
          <i className="bi bi-person-circle fs-2 text-secondary me-3"></i>
          <button type="button" onClick={handleLogout} className="btn btn-outline-secondary btn-sm rounded-pill fw-bold">
            <i className="bi bi-box-arrow-right me-1"></i> Sair
          </button>
        </header>

        <main className="p-4 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
};