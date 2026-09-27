// ============================================
// COMPONENTE RAIZ E MAPA DE ROTAS
// ============================================
// Este arquivo define quais páginas existem e quem pode acessá-las.
// A ordem de montagem é: AuthProvider -> BrowserRouter -> Routes.
//
// Ele não contém lógica de negócio: apenas decide qual componente
// renderizar conforme a URL atual (fornecida pelo React Router).

// Importa os componentes de roteamento da biblioteca react-router-dom:
// - BrowserRouter: habilita a navegação entre páginas usando a barra de endereços do navegador
// - Routes: agrupa todas as rotas da aplicação
// - Route: define uma rota específica (caminho na URL) e qual componente renderizar nela
// - Navigate: redireciona para outra rota quando o acesso é negado
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// AuthProvider: guarda e distribui a sessão do usuário (envolve TODAS as rotas).
import { AuthProvider } from './context/AuthProvider';
// useAuth: hook que as rotas abaixo usam para ler a sessão.
import { useAuth } from './context/auth-context';

import Login from './pages/Login';                 // Página de entrada (rota "/")
import Cadastro from './pages/Cadastro';           // Página de criação de conta (rota "/cadastro")
import EsqueceuSenha from './pages/EsqueceuSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import { Home } from './pages/Home';
import { MeusChamadosUsuario } from './pages/MeusChamdadosUsuario';
import { CriarChamado } from './pages/CriarChamado';
import { ChamadosTecnico } from './pages/ChamadosTecnico';
import { Sobre } from './pages/Sobre';

// Bloqueia o acesso a quem não está logado e,
// quando sóTecnico é verdadeiro, a quem não tem a role TECNICO no banco
//
// "children" é a página a ser exibida se o acesso for liberado.
// A checagem da role é feita no CLIENTE (comparando com 'TECNICO'),
// mas o backend repete a validação em cada rota protegida — a checagem
// aqui é só para melhorar a navegação, não é a barreira de segurança.
const RotaProtegida = ({ children, somenteTecnico = false }) => {
  const { usuario, carregando } = useAuth();

  // Enquanto a sessão não foi revalidada com o backend, não renderiza nada.
  // Sem isso, o usuário veria um piscar na tela de login a cada recarga,
  // porque "usuario" começa null antes da resposta de GET /auth/me.
  if (carregando) {
    return null;
  }

  // Sem sessão: volta para a tela de login.
  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  // Logado, mas sem o perfil TÉCNICO: vai para a página de chamados dele.
  if (somenteTecnico && usuario.role !== 'TECNICO') {
    return <Navigate to="/meus-chamados" replace />;
  }

  // Acesso liberado: renderiza a página pedida.
  return children;
};

// Impede que um usuário já logado volte para as telas públicas
// (login, cadastro e recuperação de senha).
// Sem isso, um técnico logado poderia ver o formulário de login de novo.
const RotaPublica = ({ children }) => {
  const { usuario, carregando } = useAuth();

  // Mesma regra de espera da RotaProtegida: nada de piscar a tela pública.
  if (carregando) {
    return null;
  }

  // Já logado: cada role cai direto na sua área.
  if (usuario) {
    return <Navigate to={usuario.role === 'TECNICO' ? '/chamados' : '/meus-chamados'} replace />;
  }

  return children;
};

// Componente principal da aplicação: apenas define o roteamento,
// decidindo qual página mostrar conforme a URL acessada
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas - só para quem não está logado.
              O "state" guarda a página que o usuário tentava abrir, para
              que ele volte para lá depois de fazer login. */}
          <Route
            path="/"
            element={
              <RotaPublica>
                <Login />
              </RotaPublica>
            }
          />

          <Route
            path="/cadastro"
            element={
              <RotaPublica>
                <Cadastro />
              </RotaPublica>
            }
          />

          <Route
            path="/esqueceu-senha"
            element={
              <RotaPublica>
                <EsqueceuSenha />
              </RotaPublica>
            }
          />

          {/* Segunda etapa do fluxo de recuperação de senha: o usuário
              cola aqui o token gerado na tela anterior e define a nova senha. */}
          <Route
            path="/redefinir-senha"
            element={
              <RotaPublica>
                <RedefinirSenha />
              </RotaPublica>
            }
          />

          {/* Rotas protegidas - exigem sessão válida */}
          <Route path="/home" element={<RotaProtegida><Home /></RotaProtegida>} />

          <Route path="/sobre" element={<RotaProtegida><Sobre /></RotaProtegida>} />

          <Route path="/meus-chamados" element={<RotaProtegida><MeusChamadosUsuario /></RotaProtegida>} />

          <Route path="/criar-chamado" element={<RotaProtegida><CriarChamado /></RotaProtegida>} />

          {/* Página exclusiva do perfil TÉCNICO. */}
          <Route path="/chamados" element={<RotaProtegida somenteTecnico><ChamadosTecnico /></RotaProtegida>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
