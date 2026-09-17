import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Página de recuperação de senha - solicita envio de link de redefinição
export default function EsqueceuSenha() {
  // Estado para armazenar o e-mail informado pelo usuário
  const [email, setEmail] = useState('');

  // Hook para navegação
  const navigate = useNavigate();

  // Valida o e-mail e redireciona para o login
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Instruções de recuperação enviadas para: ${email}`);
    navigate('/');
  };

  return (
    <div style={styles.container}>
      {/* Card de recuperação de senha */}
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Recuperar Senha</h2>
        <p style={styles.desc}>Digite seu e-mail para receber um link de redefinição.</p>

        {/* Campo de e-mail */}
        <div style={styles.inputGroup}>
          <label>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        {/* Botão de envio */}
        <button type="submit" style={styles.button}>Enviar Link</button>

        {/* Link de retorno para o login */}
        <div style={styles.links}>
          <Link to="/">Voltar para o Login</Link>
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
  links: { textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }
};
