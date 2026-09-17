import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import illustration from '../assets/modeloFS.png';

// Componente de página de cadastro de novo usuário
export default function Cadastro() {
  // Estado do formulário com os campos do usuário
  const [formData, setFormData] = useState({
    primeiroNome: '',
    ultimoNome: '',
    dataNascimento: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  // Hook para navegação entre páginas
  const navigate = useNavigate();

  // Manipula alterações nos campos do formulário
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Valida e envia o formulário de cadastro
  const handleSubmit = (e) => {
    e.preventDefault();
    // Verifica se as senhas coincidem
    if (formData.senha !== formData.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }
    alert(`Conta criada com sucesso para: ${formData.primeiroNome}`);
    navigate('/'); // Redireciona para o login após cadastro
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      {/* Card principal com layout dividido em duas colunas */}
      <div className="card border-0 shadow-lg overflow-hidden" style={{ width: '950px', borderRadius: '25px' }}>
        <div className="row g-0">
          
          {/* Lado Esquerdo - Logo e Ilustração */}
          <div className="col-md-5 bg-white d-flex flex-column justify-content-between p-4 pt-5 pb-5 border-end">
            {/* Logo do sistema */}
            <div className="text-center">
              <img src={logo} alt="The Robbins Logo" className="img-fluid" style={{ maxWidth: '200px' }} />
            </div>
            {/* Ilustração decorativa */}
            <div className="text-center flex-grow-1 d-flex align-items-center justify-content-center">
              <img src={illustration} alt="HelpDesk Illustration" className="img-fluid" style={{ maxHeight: '300px' }} />
            </div>
          </div>

          {/* Lado Direito - Formulário de cadastro */}
          <div className="col-md-7 bg-secondary p-5 text-white">
            <h1 className="text-center mb-4 fw-bold">Registrar - se</h1>
            
            <form onSubmit={handleSubmit}>
              {/* Campo: Primeiro nome */}
              <div className="mb-2">
                <input
                  type="text"
                  name="primeiroNome"
                  className="form-control rounded-pill text-center py-2 border-0"
                  placeholder="Primeiro nome"
                  value={formData.primeiroNome}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Campo: Último nome */}
              <div className="mb-2">
                <input
                  type="text"
                  name="ultimoNome"
                  className="form-control rounded-pill text-center py-2 border-0"
                  placeholder="Último nome"
                  value={formData.ultimoNome}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Campo: Data de nascimento */}
              <div className="mb-2">
                <input
                  type="date"
                  name="dataNascimento"
                  className="form-control rounded-pill text-center py-2 border-0 text-muted"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Campo: E-mail */}
              <div className="mb-2">
                <input
                  type="email"
                  name="email"
                  className="form-control rounded-pill text-center py-2 border-0"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Campo: Senha */}
              <div className="mb-2">
                <input
                  type="password"
                  name="senha"
                  className="form-control rounded-pill text-center py-2 border-0"
                  placeholder="Senha"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Campo: Confirmar senha */}
              <div className="mb-3">
                <input
                  type="password"
                  name="confirmarSenha"
                  className="form-control rounded-pill text-center py-2 border-0"
                  placeholder="Confirmar a senha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Botões de ação: Voltar e Criar conta */}
              <div className="d-flex align-items-center justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-5 py-2 fw-bold text-secondary text-uppercase"
                  onClick={() => navigate('/')}
                  >
                  Voltar
                </button>

                <button type="submit" className="btn btn-light rounded-pill px-5 py-2 fw-bold text-secondary text-uppercase">
                  Criar
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
