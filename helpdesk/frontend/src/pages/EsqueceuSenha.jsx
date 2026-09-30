import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

// Página de recuperação de senha - solicita o token de redefinição
export default function EsqueceuSenha() {
  // E-mail informado pelo usuário
  const [email, setEmail] = useState('');

  // Mensagem de erro e estado de envio.
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Token devolvido pela API. Existe porque o backend ainda não envia
  // e-mail: em desenvolvimento ele volta no corpo da resposta e precisa
  // ser exibido para que o usuário consiga testar o fluxo. Em produção
  // este estado sairia da tela e o token chegaria por e-mail.
  const [tokenGerado, setTokenGerado] = useState('');

  // Hook para navegação
  const navigate = useNavigate();

  // Solicita o token de redefinição de senha
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setTokenGerado('');

    setEnviando(true);

    try {
      const resposta = await authService.esqueceuSenha(email);

      setTokenGerado(resposta.token);
    } catch (falha) {
      // 404 = e-mail não encontrado ou conta inativa.
      setErro(falha?.response?.data?.detail || 'Não foi possível solicitar a redefinição.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Card de recuperação de senha */}
      <form onSubmit={handleSubmit}>
        <h2>Recuperar Senha</h2>
        <p style={styles.desc}>Digite seu e-mail para receber um link de redefinição.</p>

        {erro && (
          <div style={styles.avisoErro} role="alert">
            {erro}
          </div>
        )}

        {/* Campo de e-mail */}
        <div style={styles.inputGroup}>
          <label>E-mail</label>
          <input
            type="email"
            name="email"
            className="form-control rounded-pill text-center py-2 border-0"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        {/* Botão de envio */}
        <button type="submit" disabled={enviando} style={styles.button}>
          {enviando ? 'Enviando...' : 'Enviar Link'}
        </button>

        {/* Exibição do token.
            O endpoint POST /auth/forgot-password devolve
            { mensagem, token }. Sem um serviço de e-mail, o token precisa
            aparecer na tela para o usuário conseguir usá-lo. */}
        {tokenGerado && (
          <div style={styles.avisoSucesso}>
            <p style={styles.desc}>
              Token gerado. Use-o na próxima tela para definir a nova senha.
            </p>            style={styles.input}
 
            <code style={styles.token}>{tokenGerado}</code>
            <button
              type="button"
              style={styles.botaoSecundario}
              onClick={() => navigate('/redefinir-senha', { state: { token: tokenGerado } })}
            >
              Ir para a nova senha
            </button>
          </div>
        )}

        {/* Link de retorno para o login */}
        <div className="d-flex align-items-center justify-content-between mt-4">
          <button   
            type="button"
            className="btn btn-light rounded-pill px-5 py-2 fw-bold text-secondary text-uppercase"
            onClick={() => navigate('/')}
            >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}

// Estilos inline do componente
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f4f9' },
  card: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px' },
  desc: { fontSize: '0.9rem', color: '#666', marginBottom: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', marginBottom: '1rem', textAlign: 'left' },
  input: { padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' },
  avisoErro: { backgroundColor: '#f8d7da', color: '#842029', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' },
  avisoSucesso: { backgroundColor: '#d1e7dd', color: '#0f5132', padding: '0.8rem', borderRadius: '4px', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'left' },
  token: { display: 'block', backgroundColor: '#fff', padding: '0.4rem', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.75rem' },
  botaoSecundario: { width: '100%', marginTop: '0.75rem', padding: '0.6rem', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  links: { textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }
};
