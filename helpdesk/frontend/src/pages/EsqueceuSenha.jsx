// ============================================
// TELA: "ESQUECEU MINHA SENHA" (1ª etapa)
// ============================================
// Primeira tela do fluxo de recuperação de senha. O usuário digita o
// e-mail e a API devolve um token de uso único, válido por 120 minutos.
//
// COMO O FLUXO FUNCIONA
//   1. Usuário digita o e-mail e envia o formulário.
//   2. Chamamos POST /auth/forgot-password.
//   3. A API responde SEMPRE 200, exista a conta ou não (anti-enumeração:
//      responder 404 para e-mails desconhecidos permitiria a um atacante
//      descobrir quais contas estão cadastradas). Por isso o sucesso
//      aqui NÃO é definido pelo status da requisição, e sim pelo campo
//      "link" vir preenchido.
//   4. Em desenvolvimento o link é mostrado na tela (não há SMTP no
//      projeto). O botão leva para a 2ª etapa já com o token em mãos.
//
// EM PRODUÇÃO
//   O campo "link" deixou de ser devolvido pela API e o token passa a
//   chegar por e-mail. Esta tela deixa de mostrar o bloco verde e volta
//   a ser apenas "confirme que o e-mail foi enviado".

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authService } from '../services/authService';
import { traduzirErroApi } from '../services/erroApi';

// Página de recuperação de senha - solicita o token de redefinição
export default function EsqueceuSenha() {
  // E-mail informado pelo usuário (campo controlado do formulário).
  const [email, setEmail] = useState('');

  // Mensagem de erro e estado de envio.
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Resposta da API após o envio. Separada em dois campos porque elas
  // aparecem em momentos diferentes:
  //   - "mensagem" é a confirmação neutra, exibida sempre;
  //   - "link" só existe em desenvolvimento (ver nota no topo do arquivo).
  const [confirmacao, setConfirmacao] = useState('');
  const [linkGerado, setLinkGerado] = useState('');

  // Hook de navegação: leva o usuário para a 2ª etapa do fluxo.
  const navigate = useNavigate();

  // Solicita o token de redefinição de senha.
  // Disparado pelo onSubmit do <form>, ou seja, ao clicar em "Enviar"
  // ou ao pressionar Enter dentro do campo de e-mail.
  const handleSubmit = async (e) => {
    // Impede o recarregamento da página que o navegador faria por padrão.
    e.preventDefault();

    // Limpa os avisos da tentativa anterior antes de mostrar os novos.
    setErro('');
    setConfirmacao('');
    setLinkGerado('');

    setEnviando(true);

    try {
      const resposta = await authService.esqueceuSenha(email.trim());

      // A mensagem é SEMPRE a mesma, exista ou não a conta. Exibi-la é o
      // que confirma ao usuário que o pedido foi registrado.
      setConfirmacao(resposta.mensagem);

      // "link" só vem preenchido em desenvolvimento, quando o backend
      // ainda devolve o token no corpo da resposta. Em produção este
      // bloco nunca aparece, porque o link chega por e-mail.
      if (resposta.link) {
        setLinkGerado(resposta.link);
      }
    } catch (falha) {
      // Erros de rede / servidor fora do ar. A rota em si quase nunca
      // devolve 4xx, porque a resposta é 200 tanto para e-mails válidos
      // quanto inválidos — a checagem real é feita no if acima.
      const { texto } = traduzirErroApi(falha, 'solicitar a redefinição de senha');
      setErro(texto);
    } finally {
      // Roda nos dois caminhos: devolve o botão ao estado normal.
      setEnviando(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Card de recuperação de senha */}
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Recuperar Senha</h2>
        <p style={styles.desc}>
          Digite seu e-mail para receber as instruções de redefinição.
        </p>

        {/* Mensagem de erro (falha de comunicação com o servidor) */}
        {erro && (
          <div style={styles.avisoErro} role="alert">
            {erro}
          </div>
        )}

        {/* Confirmação neutra do pedido. Aparece tanto para e-mails
            cadastrados quanto para os que não existem, porque é a mesma
            mensagem nos dois casos. */}
        {confirmacao && (
          <div style={styles.avisoSucesso} role="alert">
            {confirmacao}
          </div>
        )}

        {/* Campo de e-mail */}
        <div style={styles.inputGroup}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
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

        {/* Botão de envio. Fica desabilitado durante a requisição para
            evitar o envio duplicado por cliques repetidos. */}
        <button type="submit" disabled={enviando} style={styles.button}>
          {enviando ? 'Enviando...' : 'Enviar Link'}
        </button>

        {/* Exibição do link — SOMENTE em desenvolvimento.
            O endpoint POST /auth/forgot-password devolve
            { mensagem, token, link }. Como não existe servidor de e-mail
            no projeto, o link precisa aparecer na tela para o usuário
            conseguir concluir o fluxo. Em produção este bloco inteiro
            sai daqui e o link passa a chegar por e-mail. */}
        {linkGerado && (
          <div style={styles.blocoLink}>
            <p style={styles.desc}>
              Link de redefinição (exibido apenas em desenvolvimento):
            </p>

            <code style={styles.token}>{linkGerado}</code>

            {/* Leva para a 2ª etapa. O token viaja no "state" do
                react-router para o campo já vir preenchido, economizando
                o usuário de copiar e colar. */}
            <button
              type="button"
              style={styles.botaoSecundario}
              onClick={() => navigate('/redefinir-senha')}
            >
              Ir para a nova senha
            </button>
          </div>
        )}

        {/* Link de retorno para a tela de login */}
        <div style={styles.links}>
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

// Estilos inline do componente.
// O mesmo conjunto é repetido em RedefinirSenha.jsx: as duas telas são
// públicos (sem a SidebarLayout) e seguem o mesmo formato de card central.
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f4f9' },
  card: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px' },
  desc: { fontSize: '0.9rem', color: '#666', marginBottom: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', marginBottom: '1rem', textAlign: 'left' },
  input: { padding: '0.5rem', marginTop: '0.25rem', borderRadius: '4px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' },
  avisoErro: { backgroundColor: '#f8d7da', color: '#842029', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' },
  avisoSucesso: { backgroundColor: '#d1e7dd', color: '#0f5132', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' },
  blocoLink: { backgroundColor: '#d1e7dd', color: '#0f5132', padding: '0.8rem', borderRadius: '4px', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'left' },
  token: { display: 'block', backgroundColor: '#fff', padding: '0.4rem', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.75rem' },
  botaoSecundario: { width: '100%', marginTop: '0.75rem', padding: '0.6rem', backgroundColor: '#198754', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  links: { textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }
};
