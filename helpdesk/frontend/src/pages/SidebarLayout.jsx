// ============================================
// LAYOUT PRINCIPAL (sidebar + área de conteúdo)
// ============================================
// Envolve TODAS as telas internas do sistema. Não é uma rota: cada página
// protegida (Home, MeusChamadosUsuario, CriarChamado, ChamadosTecnico e
// Sobre) renderiza <SidebarLayout>{conteúdo}</SidebarLayout> por conta
// própria, e ele desenha o menu lateral, o cabeçalho com o botão de sair
// e a área onde o conteúdo da página aparece.
//
// O menu muda conforme o perfil:
//   - USUARIO: "Meus chamados" e "Novo chamado";
//   - TECNICO: "Home", "Chamados Técnico" e "Serviços";
//   - ADMIN: "Painel" (tempo real), "Unidades" e "Setores".

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth, ROLE_LABEL } from '../context/auth-context';
import logoImg from '../assets/logo.png';
import helpdeskImg from '../assets/helpdesk.png';

// Layout principal com sidebar fixa e área de conteúdo
// Recebe children (conteúdo da página) e exibe sidebar baseada no tipo de usuário logado
export const SidebarLayout = ({ children }) => {
  // Hooks para localização atual, navegação e autenticação
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  // Redireciona para o login se o usuário não estiver autenticado
  useEffect(() => {
    if (!usuario) {
      navigate('/');
    }
  }, [usuario, navigate]);

  // Evita renderizar o layout antes da verificação de autenticação
  if (!usuario) {
    return null;
  }

  // Obtém o tipo de usuário do contexto de autenticação
  const userType = ROLE_LABEL[usuario.role] || usuario.role;

  // Realiza o logout e redireciona para o login
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar Fixa - Menu lateral */}
      <div className="d-flex flex-column bg-secondary text-white p-3" style={{ width: '240px' }}>
        {/* Logo e nome do sistema */}
        <div className="text-center mb-4">
          <img src={logoImg} alt="The Robbins Logo" className="img-fluid mb-2" style={{ maxHeight: '50px' }} />
          <h5 className="fw-bold m-0">THE ROBBINS</h5>
          <small className="text-light fs-7 d-block">SOFTWARE AS A SERVICE</small>
        </div>
        
        {/* Navegação principal da sidebar - muda conforme o perfil */}
        <ul className="nav nav-pills flex-column mb-auto">
          {/* Perfil USUARIO: área dele */}
          {usuario.role === 'USUARIO' && (
            <>
              {/* Link: Home - página inicial do usuário comum */}
              <li className="nav-item mb-2">
                <Link to="/home" className={`nav-link text-white ${location.pathname === '/home' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-house-door me-2 fs-5"></i> Home
                </Link>
              </li>

              {/* Link: Meus chamados */}
              <li className="nav-item mb-2">
                <Link to="/meus-chamados" className={`nav-link text-white ${location.pathname.includes('meus-chamados') ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-headset me-2 fs-5"></i> Meus chamados
                </Link>
              </li>

              {/* Link: Novo chamado */}
              <li className="nav-item mb-2">
                <Link to="/criar-chamado" className={`nav-link text-white ${location.pathname === '/criar-chamado' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-plus-square me-2 fs-5"></i> Novo chamado
                </Link>
              </li>
            </>
          )}

          {/* Perfil TECNICO: Home (mesmas funções do usuário) + fila e serviços */}
          {usuario.role === 'TECNICO' && (
            <>
              {/* Link: Home - dashboard de serviços e contadores de chamados */}
              <li className="nav-item mb-2">
                <Link to="/home" className={`nav-link text-white ${location.pathname === '/home' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-house-door me-2 fs-5"></i> Home
                </Link>
              </li>

              {/* Link: Chamados Técnico (fila de atendimento) */}
              <li className="nav-item mb-2">
                <Link to="/chamados" className={`nav-link text-white ${location.pathname === '/chamados' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-clipboard me-2 fs-5"></i> Chamados Técnico
                </Link>
              </li>

              {/* Link: Serviços.
                  Leva para a rota própria "/servicos", onde ficam o
                  cadastro, a edição, a remoção e a listagem dos serviços. */}
              <li className="nav-item mb-2">
                <Link to="/servicos" className={`nav-link text-white ${location.pathname === '/servicos' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-tools me-2 fs-5"></i> Serviços
                </Link>
              </li>
            </>
          )}

          {/* Perfil ADMIN: painel em tempo real + configurações da empresa */}
          {usuario.role === 'ADMIN' && (
            <>
              {/* Link: Painel — chamados em tempo real (webSocket) */}
              <li className="nav-item mb-2">
                <Link to="/admin" className={`nav-link text-white ${location.pathname === '/admin' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-speedometer2 me-2 fs-5"></i> Painel
                </Link>
              </li>

              {/* Link: Unidades.
                  Leva para a rota própria "/unidades", onde o admin cria,
                  edita e remove as unidades (Matriz, filiais). */}
              <li className="nav-item mb-2">
                <Link to="/unidades" className={`nav-link text-white ${location.pathname === '/unidades' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-building me-2 fs-5"></i> Unidades
                </Link>
              </li>

              {/* Link: Setores.
                  Leva para a rota própria "/setores", onde o admin cria,
                  edita e remove os setores que aparecem no cadastro. */}
              <li className="nav-item mb-2">
                <Link to="/setores" className={`nav-link text-white ${location.pathname === '/setores' ? 'active bg-dark' : ''}`}>
                  <i className="bi bi-diagram-3 me-2 fs-5"></i> Setores
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Imagem ilustrativa na sidebar */}
        <div className="text-center my-3">
          <img src={helpdeskImg} alt="Help Desk Support" className="img-fluid" style={{ maxHeight: '90px' }} />
        </div>

        {/* Link: Sobre */}
        <div className="mt-auto border-top pt-2">
          <Link to="/sobre" className={`nav-link text-white ${location.pathname === '/sobre' ? 'active bg-dark' : ''}`}>
            <i className="bi bi-info-circle me-2"></i> Sobre
          </Link>
        </div>
      </div>

      {/* Área de conteúdo principal */}
      <div className="flex-grow-1 d-flex flex-column overflow-auto">
        {/* Cabeçalho com perfil do usuário e botão de logout */}
        <header className="d-flex justify-content-end align-items-center p-3 bg-white border-bottom shadow-sm">
          <div className="text-end me-2">
            {/* O nome e a role vêm do backend (GET /auth/me), não do e-mail digitado. */}
            <strong className="text-dark d-block">{usuario.nome}</strong>
            <small className="text-muted">{userType}</small>
          </div>
          <i className="bi bi-person-circle fs-2 text-secondary me-3"></i>
          <button type="button" onClick={handleLogout} className="btn btn-outline-secondary btn-sm rounded-pill fw-bold">
            <i className="bi bi-box-arrow-right me-1"></i> Sair
          </button>
        </header>

        {/* Conteúdo da página atual (renderizado via React Router) */}
        <main className="p-4 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
};
