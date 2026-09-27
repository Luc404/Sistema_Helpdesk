import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

// Página que finaliza a troca de senha.
//
// Ela completa o fluxo iniciado em EsqueceuSenha:
//   1. POST /auth/forgot-password  -> devolve um token (válido por 2 horas)
//   2. POST /auth/reset-password   -> usa esse token para gravar a nova senha
//
// O token chega preenchido quando o usuário vem da tela anterior, via
// "state" do react-router. Se ele abrir a página direto, o campo fica
// vazio para ele colar o token à mão.
export default function RedefinirSenha() {
  // Lê o "state" enviado pela tela anterior (pode ser undefined).
  const location = useLocation();

  // Campos do formulário
  const [formData, setFormData] = useState({
    token: location.state?.token || '',
    novaSenha: '',
    confirmarSenha: '',
  });

  // Mensagens de erro, sucesso e estado de envio
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Manipula alterações nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Envia a nova senha junto com o token de redefinição
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (formData.novaSenha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (formData.novaSenha.length < 6) {
      setErro('A senha precisa ter ao menos 6 caracteres.');
      return;
    }

    setEnviando(true);

    try {
      // O nome do campo na API é "nova_senha" (não "senha"), e o token
      // é de uso único: depois desta chamada ele é apagado do banco.
      await authService.redefinirSenha(formData.token.trim(), formData.novaSenha);

      setSucesso('Senha alterada com sucesso. Faça login com a nova senha.');
    } catch (falha) {
      // 400 = token inválido ou expirado (o FastAPI manda em "detail").
      setErro(falha?.response?.data?.detail || 'Não foi possível alterar a senha.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Definir nova senha</h2>
        <p style={styles.desc}>
          Informe o token recebido e escolha a nova senha.
        </p>

        {erro && (
          <div style={styles.avisoErro} role="alert">
            {erro}
          </div>
        )}

        {sucesso && (
          <div style={styles.avisoSucesso} role="alert">
            {sucesso}
          </div>
        )}

        {/* Campo do token de redefinição */}
        <div style={styles.inputGroup}>
          <label>Token de redefinição</label>
          <input
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Campo da nova senha */}
        <div style={styles.inputGroup}>
          <label>Nova senha</label>
          <input
            type="password"
            name="novaSenha"
            value={formData.novaSenha}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Campo de confirmação da nova senha */}
        <div style={styles.inputGroup}>
          <label>Confirmar a nova senha</label>
          <input
            type="password"
            name="confirmarSenha"
            value={formData.confirmarSenha}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Botão de envio */}
        <button type="submit" disabled={enviando} style={styles.button}>
          {enviando ? 'Salvando...' : 'Salvar nova senha'}
        </button>

        {/* Link de retorno para o login */}
        <div style={styles.links}>
          {sucesso ? (
            <Link to="/">Ir para o login</Link>
          ) : (
            <Link to="/esqueceu-senha">Gerar outro token</Link>
          )}
        </div>
      </form>
    </div>
  );
}

// Estilos inline do componente (mesmo padrão de EsqueceuSenha)
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f4f9' },
  card: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px' },
  desc: { fontSize: '0.9rem', color: '#666', marginBottom: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', marginBottom: '1rem', textAlign: 'left' },
  input: { padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' },
  avisoErro: { backgroundColor: '#f8d7da', color: '#842029', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' },
  avisoSucesso: { backgroundColor: '#d1e7dd', color: '#0f5132', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' },
  links: { textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }
};
