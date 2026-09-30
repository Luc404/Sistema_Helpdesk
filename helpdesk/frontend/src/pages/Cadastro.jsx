// ============================================
// TELA: CADASTRO DE NOVA CONTA
// ============================================
// Formulário público de criação de conta. Fica disponível apenas para
// quem ainda não está logado (ver RotaPublica em App.jsx).
//
// Duasparticularidades desta tela em relação às demais:
//   - Os campos "primeiroNome" e "ultimoNome" existem só aqui. A API
//     espera um único campo "nome", então os dois são concatenados no
//     momento do envio (veja o handleSubmit abaixo).
//   - O cadastro público sempre cria o usuário com role USUARIO. A
//     promoção para TÉCNICO é feita por outro usuário, em
//     PUT /users/{id}, que exige perfil técnico.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { traduzirErroApi } from '../services/erroApi';
import { ERRO_SENHA_CURTA, senhaAtendeTamanho } from '../constants/labels';
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

  // Mensagens de erro e estado de envio.
  // Antes esta página usava alert(), que não integra com o layout.
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Hook para navegação entre páginas
  const navigate = useNavigate();

  // Manipula alterações nos campos do formulário.
  // O mesmo handler atende todos os inputs: o"name" do campo diz qual
  // propriedade do objeto formData deve ser atualizada.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Valida e envia o formulário de cadastro
  const handleSubmit = async (e) => {
    // Evita o reload padrão do navegador no envio do formulário.
    e.preventDefault();
    setErro('');

    // Confere se as senhas batem antes de chamar a API
    if (formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    // Regra mínima de tamanho de senha, validada aqui para não
    // gastar uma ida ao servidor com um dado que já sabemos inválido.
    // A regra oficial vive no backend (SENHA_MINIMO_CARACTERES) e é
    // reaproveitada pela tela de redefinição de senha.
    if (!senhaAtendeTamanho(formData.senha)) {
      setErro(ERRO_SENHA_CURTA);
      return;
    }

    setEnviando(true);

    try {
      // A API (UserCreate) espera um campo "nome" único, e não
      // "primeiroNome"/"ultimoNome" separados como no formulário.
      // Também não existe "unidade_id" aqui: o usuário é criado sem
      // unidade e a role padrão é sempre USUARIO.
      // O metodo se chama "cadastro" (ver authService.ts:35).
      // Escrever "cadastrar" quebrava a tela com
      // "TypeError: authService.cadastrar is not a function".
      await authService.cadastro({
        nome: `${formData.primeiroNome} ${formData.ultimoNome}`.trim(),
        email: formData.email,
        senha: formData.senha,
        data_nascimento: formData.dataNascimento || null,
      });

      navigate('/');
    } catch (falha) {
      // Antes esta tela mostrava sempre "Nao foi possivel criar a conta",
      // tanto para e-mail duplicado (409) quanto para backend fora do ar,
      // e o erro real era descartado sem aparecer no console.
      // O traduzirErroApi separa os dois casos e registra o log completo.
      const { texto, mostrarDetalhe } = traduzirErroApi(falha, 'criar a conta');

      setErro(texto);

      // Detalhe tecnico no console, util para diagnosticar em segundos
      console.error('[Cadastro] detalhe do erro:', mostrarDetalhe);
    } finally {
      setEnviando(false);
    }
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
              {/* Mensagem de erro devolvida pela API ou pela validação local */}
              {erro && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {erro}
                </div>
              )}

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

              {/* Link para recuperação de senha. Aparece para quem já tem
                  conta e só esqueceu a senha — a tela de login é que
                  normalmente oferece esse atalho. */}
              <div className="text-end mb-2">
                <Link to="/esqueceu-senha" className="text-light text-decoration-none fw-semibold small">
                  Esqueceu a senha?
                </Link>
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

                <button type="submit" disabled={enviando} className="btn btn-light rounded-pill px-5 py-2 fw-bold text-secondary text-uppercase">
                  {enviando ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
