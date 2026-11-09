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
import { useEffect, useState } from 'react';
import { useAuth, ROLE_LABEL } from '../context/auth-context';
import logoImg from '../assets/logo.png';
import helpdeskImg from '../assets/helpdesk.png';
import { ChatIA } from '../components/ChatIA';

// Layout principal com sidebar fixa e área de conteúdo
// Recebe children (conteúdo da página) e exibe sidebar baseada no tipo de usuário logado
export const SidebarLayout = ({ children }) => {
  // Hooks para localização atual, navegação e autenticação
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  // RESPONSIVIDADE: controla a abertura da sidebar no celular.
  // No desktop (>= 992px) esse estado é ignorado, porque a sidebar fica
  // sempre visível ao lado do conteúdo (classes d-lg-flex / CSS).
  // Ele precisa ficar DENTRO do componente: hooks só podem ser chamados
  // no corpo de um componente ou de outro hook.
  const [menuAberto, setMenuAberto] = useState(false);

  // O menu mobile é fechado pelo onClick do container da sidebar logo
  // abaixo: qualquer clique em um link (ou no botão de fechar/backdrop)
  // executa setMenuAberto(false). Não usamos useEffect aqui porque
  // chamar setState dentro de um efeito dispara renders em cascata.

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
    // min-vh-100 (em vez de vh-100) evita o "pulo" causado pela barra de
    // endereço dos navegadores móveis, que muda a altura visível.
    <div className="d-flex min-vh-100 w-100 bg-light position-relative">
      {/* RESPONSIVIDADE — fundo escuro do menu mobile.
          Só aparece abaixo de 992px (d-lg-none) quando o menu está aberto.
          Clicar nele fecha o menu, como em qualquer app de celular. */}
      {menuAberto && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 1040 }}
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Menu lateral.
          No desktop ela fica no fluxo (lado esquerdo, sempre visível).
          No celular vira um painel fixo por cima do conteúdo, controlado
          pelo estado menuAberto. As classes de comportamento (posição,
          largura, mostrar/esconder) estão em index.css (.sidebar-helpdesk),
          porque o CSS do Bootstrap sozinho não tem "position-lg-static". */}
      <div
        className={`sidebar-helpdesk d-flex flex-column bg-secondary text-white p-3 ${menuAberto ? 'sidebar-aberta' : 'sidebar-fechada'} d-lg-flex`}
        onClick={() => setMenuAberto(false)}
      >
        {/* Botão de fechar — só no mobile (d-lg-none) */}
        <button
          type="button"
          className="btn btn-outline-light btn-sm align-self-end d-lg-none mb-2"
          onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
        >
          <i className="bi bi-x-lg"></i>
        </button>

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
        {/* Cabeçalho com perfil do usuário e botão de logout.
            RESPONSIVIDADE: flex-wrap + gap deixam os itens quebrarem
            linha em telas estreitas em vez de espremer tudo numa linha. */}
        <header className="d-flex flex-wrap justify-content-end align-items-center gap-2 p-3 bg-white border-bottom shadow-sm">
          {/* Botão "hambúrguer" — só aparece no mobile (d-lg-none).
              me-auto empurra o restante do cabeçalho para a direita. */}
          <button
            type="button"
            className="btn btn-outline-secondary d-lg-none me-auto"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
          >
            <i className="bi bi-list fs-4"></i>
          </button>

          {/* Nome e perfil: escondidos só em telas muito pequenas (d-none d-sm-block)
              para o cabeçalho não ficar apertado. */}
          <div className="text-end me-2 d-none d-sm-block">
            {/* O nome e a role vêm do backend (GET /auth/me), não do e-mail digitado. */}
            <strong className="text-dark d-block">{usuario.nome}</strong>
            <small className="text-muted">{userType}</small>
          </div>
          <i className="bi bi-person-circle fs-2 text-secondary me-3"></i>
          <button type="button" onClick={handleLogout} className="btn btn-outline-secondary btn-sm rounded-pill fw-bold">
            <i className="bi bi-box-arrow-right me-1"></i> Sair
          </button>
        </header>

        {/* Conteúdo da página atual (renderizado via React Router).
            p-3 no mobile e p-4 a partir de md: menos padding em telas
            pequenas para sobrar mais espaço para o conteúdo. */}
        <main className="p-3 p-md-4 flex-grow-1">
          {children}
        </main>
      </div>

      <ChatIA />
    </div>
  );
};
