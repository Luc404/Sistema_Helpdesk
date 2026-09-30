// ============================================
// TELA: SOBRE
// ============================================
// Página informativa sobre o sistema, com os dados do usuário logado e
// um resumo do que cada perfil pode fazer. A rota é "/sobre" e fica atrás
// de RotaProtegida.
//
// NOTA HISTÓRICA: existia um link "Sobre" na sidebar apontando para
// /sobre, mas a rota não estava registrada em App.jsx — clicar nele
// deixava a tela em branco. A rota foi adicionada ao mapa de rotas.

import { SidebarLayout } from './SidebarLayout';
import { useAuth, ROLE_LABEL } from '../context/auth-context';

// Página informativa do sistema.
// Existia um link "Sobre" na sidebar apontando para /sobre, mas a rota
// não estava registrada em App.jsx: clicar nele deixava a tela em branco.
export const Sobre = () => {
  // Perfil do usuário logado, exibido no corpo da página.
  const { usuario, isTecnico } = useAuth();

  return (
    <SidebarLayout>
      <div className="container" style={{ maxWidth: '650px' }}>
        <div className="card border-secondary shadow-sm">
          <div className="card-header bg-white text-center py-3">
            <i className="bi bi-info-circle fs-1 text-dark"></i>
            <h4 className="fw-bold mt-2">Sobre o HelpDesk</h4>
          </div>

          <div className="card-body bg-secondary text-white">
            <p className="small">
              O HelpDesk é o sistema de gestão de chamados de suporte interno.
              O usuário comum abre e acompanha seus chamados; o perfil técnico
              atende chamados, gerencia serviços e unidades e altera o status
              de qualquer atendimento.
            </p>

            <hr className="border-light" />

            <p className="small mb-1">Você está conectado como:</p>
            <ul className="list-unstyled small mb-0">
              <li>
                <strong>Nome:</strong> {usuario?.nome}
              </li>
              <li>
                <strong>E-mail:</strong> {usuario?.email}
              </li>
              <li>
                <strong>Perfil:</strong> {ROLE_LABEL[usuario?.role] || usuario?.role}
              </li>
              <li>
                <strong>Unidade:</strong> {usuario?.unidade_id ?? 'não informada'}
              </li>
            </ul>

            <hr className="border-light" />

            <p className="small mb-0">
              {isTecnico
                ? 'Você tem acesso à fila completa de chamados e pode alterar o status de qualquer atendimento.'
                : 'Você acompanha apenas os chamados que abriu e os que está em cópia.'}
            </p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
