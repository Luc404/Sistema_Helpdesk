import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import logo from '../assets/logo.png';
import illustration from '../assets/modeloFS.png';

// Página de login do sistema
export default function Login() {
  // Estado dos campos de e-mail e senha
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Hook para navegação e contexto de autenticação
  const navigate = useNavigate();
  const { login } = useAuth();

  // Valida as credenciais e realiza o login
  const handleSubmit = (e) => {
    e.preventDefault();
    // Determina o tipo de usuário baseado no e-mail
    // Se o e-mail contém "tecnico", é técnico; caso contrário, é usuário comum
    const tipoUsuario = email.toLowerCase().includes('tecnico') ? 'Técnico' : 'Usuário';
    alert(`Acessando conta: ${email} (${tipoUsuario})`);
    login(email, tipoUsuario);  // Registra o usuário e tipo no contexto de autenticação
    navigate('/home');          // Redireciona para a página inicial
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

              {/* Botões de ação: Login e Registrar-se */}
              <div className="d-flex gap-3">
                <button type="submit" className="btn btn-secondary btn-lg rounded-pill w-50 py-2 fw-bold text-uppercase">
                  Login
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
