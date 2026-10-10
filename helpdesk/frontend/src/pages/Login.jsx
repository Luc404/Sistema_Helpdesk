// ============================================
// TELA: LOGIN
// ============================================
// Ponto de entrada do sistema. É a única rota "/" do App.jsx e fica
// protegida por RotaPublica: quem já está logado é redirecionado direto
// para a sua área (/chamados para técnico, /meus-chamados para usuário).
//
// A tela não chama a API diretamente: o submit delega para o "login" do
// AuthProvider, que é quem chama o backend e guarda o token no
// localStorage (ver context/AuthProvider.jsx e services/authStorage.ts).

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, rotaInicial } from '../context/auth-context';

import logo from '../assets/logo.png';
import illustration from '../assets/modeloFS.png';

// Página de login do sistema
export default function Login() {
  // Estado dos campos de e-mail e senha
  const [email, setEmail] = useState('');   // Digitado no primeiro input
  const [senha, setSenha] = useState('');   // Digitado no campo de senha
  const [erro, setErro] = useState('');     // Mensagem exibida no alert vermelho
  const [carregando, setCarregando] = useState(false); // Desabilita o botão durante o envio

  // Alterna a visibilidade dos campos: "olhinho" mostra/oculta o texto
  // tanto da senha do login quanto da chave mestre, sem recarregar a página.
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarChave, setMostrarChave] = useState(false);

  // FLUXO TEMPORÁRIO da "chave mestre": se o botão foi clicado, mostra o
  // campo da chave; e a chave digitada até agora.
  const [mostrandoChave, setMostrandoChave] = useState(false);
  const [chave, setChave] = useState('');
  const [carregandoChave, setCarregandoChave] = useState(false);

  // Hook para navegação e contexto de autenticação
  // navigate() troca de rota; "login" vem do AuthProvider e já persiste
  // o token no navegador (veja context/AuthProvider.jsx).
  const navigate = useNavigate();
  const { login, loginMaster } = useAuth();

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

      // Cada role cai na sua página inicial (rotaInicial em auth-context.js)
      navigate(rotaInicial(user.role));
    } catch (error) {
      // 401 (credenciais erradas) e 403 (conta inativa) trazem a mensagem
      // do backend no campo "detail".
      setErro(error.response?.data?.detail || 'Email ou senha inválidos.');
    } finally {
      // Roda tanto no sucesso quanto no erro: o botão volta ao normal.
      setCarregando(false);
    }
  };

  // FLUXO TEMPORÁRIO: encerra o login pela chave mestre.
  // O botão "Chave mestre" é a porta de entrada provisória do perfil ADMIN;
  // quando existir um primeiro acesso oficial, ele e o endpoint /auth/master-key
  // devem ser removidos.
  const handleChaveMestre = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregandoChave(true);

    try {
      const user = await loginMaster(chave.trim());
      navigate(rotaInicial(user.role));
    } catch (error) {
      setErro(error.response?.data?.detail || 'Chave mestre inválida.');
    } finally {
      setCarregandoChave(false);
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

              {/* Campo: Senha (com "olhinho" para mostrar/ocultar) */}
              <div className="mb-2">
                <div className="input-group">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    className="form-control form-control-lg rounded-pill-start text-center bg-secondary text-white placeholder-white border-0 py-3"
                    placeholder="Password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text rounded-pill-end bg-secondary text-white border-0 px-3"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <i className={`bi ${mostrarSenha ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
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

              {/* FLUXO TEMPORÁRIO — acesso do ADMIN.
                  Expande um campo para a "chave mestre" (POST /auth/master-key).
                  Quando houver um primeiro acesso oficial de administrador,
                  este botão e o fluxo devem ser removidos. */}
              {!mostrandoChave ? (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="btn btn-link text-muted text-decoration-none small"
                    onClick={() => {
                      setErro('');
                      setMostrandoChave(true);
                    }}
                  >
                    <i className="bi bi-key me-1"></i> Chave mestre
                  </button>
                </div>
              ) : (
                // Não pode ser um <form> aqui: já existe um <form> pai
                // (o de e-mail+senha), e formulários aninhados são inválidos.
                <div className="mt-3">
                  <div className="input-group">
                    <input
                      type={mostrarChave ? 'text' : 'password'}
                      className="form-control rounded-pill-start text-center"
                      placeholder="Digite a chave mestre"
                      value={chave}
                      onChange={(e) => setChave(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-0"
                      onClick={() => setMostrarChave(!mostrarChave)}
                      aria-label={mostrarChave ? 'Ocultar chave mestre' : 'Mostrar chave mestre'}
                      title={mostrarChave ? 'Ocultar chave mestre' : 'Mostrar chave mestre'}
                    >
                      <i className={`bi ${mostrarChave ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                    <button
                      type="button"
                      disabled={carregandoChave}
                      onClick={handleChaveMestre}
                      className="btn btn-outline-secondary rounded-pill-end fw-bold text-uppercase px-3"
                    >
                      {carregandoChave ? '...' : 'Entrar'}
                    </button>
                  </div>
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      className="btn btn-link text-muted text-decoration-none small"
                      onClick={() => {
                        setMostrandoChave(false);
                        setChave('');
                        setErro('');
                      }}
                    >
                      Voltar ao login
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
