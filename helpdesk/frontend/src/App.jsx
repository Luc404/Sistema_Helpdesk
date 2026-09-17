// Importa os componentes de roteamento da biblioteca react-router-dom:
// - BrowserRouter: habilita a navegação entre páginas usando a barra de endereços do navegador
// - Routes: agrupa todas as rotas da aplicação
// - Route: define uma rota específica (caminho na URL) e qual componente renderizar nela
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthProvider';

// Importa as três páginas do sistema
import Login from './pages/Login';                 // Página de entrada (rota "/")
import Cadastro from './pages/Cadastro';           // Página de criação de conta (rota "/cadastro")
import EsqueceuSenha from './pages/EsqueceuSenha';
import { Home } from './pages/Home';
import { MeusChamadosUsuario } from './pages/MeusChamdadosUsuario';
import { CriarChamado } from './pages/CriarChamado';
import { ChamadosTecnico } from './pages/ChamadosTecnico';

// Componente principal da aplicação: apenas define o roteamento,
// decidindo qual página mostrar conforme a URL acessada
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota principal ("/") -> mostra a página de Login */}
          <Route path="/" element={<Login />} />

          {/* Rota "/cadastro" -> mostra a página de criação de conta */}
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Rota "/esqueceu-senha" -> mostra a página de recuperação de senha */}
          <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />

          <Route path="/home" element={<Home />} />
          <Route path="/meus-chamados" element={<MeusChamadosUsuario />} />
          <Route path="/criar-chamado" element={<CriarChamado />} />
          <Route path="/chamados" element={<ChamadosTecnico />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
