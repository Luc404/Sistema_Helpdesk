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

import { useCallback } from 'react';
import { SidebarLayout } from './SidebarLayout';
import { useRequisicao } from '../hooks/useRequisicao';
import { unidadeService } from '../services/unidadeService';
import { useAuth, ROLE_LABEL } from '../context/auth-context';

// Página informativa do sistema.
export const Sobre = () => {
  // Perfil do usuário logado, exibido no corpo da página.
  const { usuario, isTecnico } = useAuth();

  // A sessão traz apenas "unidade_id". Para mostrar o NOME da unidade (e
  // não o número), buscamos a lista pública de unidades e resolvemos o id.
  const carregarUnidades = useCallback(() => unidadeService.listar(), []);
  const { dados: unidades } = useRequisicao(carregarUnidades);

  // Nome da unidade do usuário: "não informada" quando o id é nulo e
  // "carregando..." enquanto a lista de unidades ainda não chegou.
  const nomeUnidade = !usuario?.unidade_id
    ? 'não informada'
    : unidades?.find((u) => u.id === usuario.unidade_id)?.nome ?? 'carregando...';

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
              atende chamados e gerencia serviços; o administrador gerencia
              unidades e setores e acompanha todos os chamados em tempo real.
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
                <strong>Unidade:</strong> {nomeUnidade}
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
