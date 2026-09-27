import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

import logo from '../assets/logo.png';
import illustration from '../assets/modeloFS.png';

// Página de login do sistema
export default function Login() {
  // Estado dos campos de e-mail e senha
  const [email, setEmail] = useState('');   // Digitado no primeiro input
  const [senha, setSenha] = useState('');   // Digitado no campo de senha
  const [erro, setErro] = useState('');     // Mensagem exibida no alert vermelho
  const [carregando, setCarregando] = useState(false); // Desabilita o botão durante o envio

  // Hook para navegação e contexto de autenticação
  // navigate() troca de rota; "login" vem do AuthProvider e já persiste
  // o token no navegador (veja context/AuthProvider.jsx).
  const navigate = useNavigate();
  const { login } = useAuth();

  // Valida as credenciais e realiza o login
  // Disparado pelo onSubmit do <form>, ou seja, ao clicar em Login
  // ou ao pressionar Enter dentro de qualquer campo.
  const handleSubmit = async (e) => {
    // Impede o recarregamento da página que o navegador faria por padrão
    // ao enviar um <form> comum.
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      // O login delega ao contexto, que chama o backend e guarda token + role
      const user = await login(email, senha);

      // Cada role cai na sua página inicial
      navigate(user.role === 'TECNICO' ? '/chamados' : '/meus-chamados');
    } catch (error) {
      // 401 (credenciais erradas) e 403 (conta inativa) trazem a mensagem
      // do backend no campo "detail".
      setErro(error.response?.data?.detail || 'Email ou senha inválidos.');
    } finally {
      // Roda tanto no sucesso quanto no erro: o botão volta ao normal.
      setCarregando(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      {/* Card principal com layout dividido em duas colunas */}
      <div className="card border-0 shadow-lg overflow-hidden" style={{ width: '900px', borderRadius: '25px' }}>
        <div className="row g-0">
          
          {/* Lado Esquerdo - Ilustração e Logo */}
          <div className="col-md-5 bg-secondary d-flex flex-column justify-content-between p-4 pt-5 pb-5">
            {/* Logo do sistema */}
            <div className="text-center">
              <img src={logo} alt="The Robbins Logo" className="img-fluid" style={{ maxWidth: '200px' }} />
            </div>
            {/* Ilustração decorativa */}
            <div className="text-center flex-grow-1 d-flex align-items-center justify-content-center">
              <img src={illustration} alt="HelpDesk Illustration" className="img-fluid" style={{ maxHeight: '300px' }} />
            </div>
          </div>

          {/* Lado Direito - Formulário de login */}
          <div className="col-md-7 bg-light p-5 d-flex flex-column justify-content-center">
            <h1 className="text-center text-secondary mb-4 fw-bold">Login</h1>
            
            <form onSubmit={handleSubmit}>
              {/* Campo: Nome de usuário ou e-mail */}
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control form-control-lg rounded-pill text-center bg-secondary text-white placeholder-white border-0 py-3"
                  placeholder="Username / E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Campo: Senha */}
              <div className="mb-2">
                <input
                  type="password"
                  className="form-control form-control-lg rounded-pill text-center bg-secondary text-white placeholder-white border-0 py-3"
                  placeholder="Password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              {/* Link para recuperação de senha */}
              <div className="text-end mb-4">
                <Link to="/esqueceu-senha" className="text-secondary text-decoration-none fw-semibold">
                  Esqueceu a senha
                </Link>
              </div>

              {/* Mensagem de erro devolvida pelo backend */}
              {erro && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {erro}
                </div>
              )}

              {/* Botões de ação: Login e Registrar-se */}
              <div className="d-flex gap-3">
                <button type="submit" disabled={carregando} className="btn btn-secondary btn-lg rounded-pill w-50 py-2 fw-bold text-uppercase">
                  {carregando ? 'Entrando...' : 'Login'}
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/cadastro')} 
                  className="btn btn-secondary btn-lg rounded-pill w-50 py-2 fw-bold text-uppercase"
                >
                  Registrar-se
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
