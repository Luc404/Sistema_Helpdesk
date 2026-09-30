// ============================================
// TELA: "DEFINIR NOVA SENHA" (2ª etapa)
// ============================================
// Última tela do fluxo de recuperação de senha. O usuário confirma o token
// recebido e escolhe a senha nova.
//
// COMO O FLUXO FUNCIONA
//   1. Usuário chega aqui pelo link /redefinir-senha?token=...
//      (em produção, pelo link enviado por e-mail).
//   2. Na montagem da tela chamamos GET /auth/reset-password/validar para
//      avisar imediatamente se o link venceu ou já foi usado — antes de
//      o usuário digitar a senha à toa.
//   3. No envio chamamos POST /auth/reset-password com o token e a senha
//      nova. O token é de USO ÚNICO: some do banco assim que a troca
//      acontece, então não dá para reenviar o formulário com o mesmo link.
//   4. Sucesso: o usuário volta para o login com a senha nova.
//
// DE ONDE VEM O TOKEN
//   O link montado pelo backend (password_reset_token_service.montar_link_redefinicao)
//   traz o token na query string: /redefinir-senha?token=abc123.
//   Também é aceito o token colado à mão no campo, para o caso de o
//   usuário ter perdido o link.

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { authService } from '../services/authService';
import { traduzirErroApi } from '../services/erroApi';
import { ERRO_SENHA_CURTA, senhaAtendeTamanho } from '../constants/labels';

// Página que finaliza a troca de senha.
export default function RedefinirSenha() {
  // Lê a query string da URL. O token chega em "?token=..." pelo link
  // gerado na tela anterior (ou pelo e-mail, em produção).
  const [searchParams] = useSearchParams();
  const tokenDaUrl = searchParams.get('token') || '';

  // Campos do formulário.
  const [formData, setFormData] = useState({
    token: tokenDaUrl,
    novaSenha: '',
    confirmarSenha: '',
  });

  // Mensagens de erro, sucesso e estado de envio.
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Estado da consulta de validade do token:
  //   null    -> ainda não consultou (ou está consultando);
  //   true    -> token válido, formulário liberado;
  //   false   -> token vencido/inexistente, formulário bloqueado.
  const [tokenValido, setTokenValido] = useState(null);

  // Confere a validade do token assim que a tela abre.
  //
  // Sem token nenhum não há o que consultar: o campo fica liberado para
  // o usuário colar o token à mão.
  useEffect(() => {
    // Guarda se a tela continua montada: o useEffect roda também na
    // limpeza, e setState em componente desmontado gera aviso no React.
    let cancelado = false;

    async function conferirToken() {
      try {
        const situacao = await authService.validarTokenReset(tokenDaUrl);

        if (!cancelado) setTokenValido(situacao.valido);
      } catch (falha) {
        // Falha de rede: não podemos afirmar que o token é inválido,
        // então deixamos o formulário liberado e o POST final decide.
        if (!cancelado) setTokenValido(null);
        console.error('[RedefinirSenha] falha ao validar o token:', falha);
      }
    }

    if (tokenDaUrl) {
      conferirToken();
    }

    // Limpeza do efeito ao trocar de tela.
    return () => {
      cancelado = true;
    };
  }, [tokenDaUrl]);

  // Manipula alterações nos campos do formulário.
  // O mesmo handler atende todos os inputs: o "name" do campo diz qual
  // propriedade do objeto formData deve ser atualizada.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Envia a nova senha junto com o token de redefinição.
  const handleSubmit = async (e) => {
    // Evita o reload padrão do navegador no envio do formulário.
    e.preventDefault();

    // Limpa os avisos da tentativa anterior.
    setErro('');
    setSucesso('');

    // Validações locais. O backend também checa tudo isso (e por último
    // é ele quem decide), mas avisar aqui evita uma ida ao servidor
    // com um dado que já sabemos estar inválido.
    if (!formData.token.trim()) {
      setErro('Informe o token de redefinição.');
      return;
    }

    if (!senhaAtendeTamanho(formData.novaSenha)) {
      setErro(ERRO_SENHA_CURTA);
      return;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);

    try {
      // O nome do campo na API é "nova_senha" (não "senha"), e o token
      // é de uso único: depois desta chamada ele é apagado do banco.
      await authService.redefinirSenha(formData.token.trim(), formData.novaSenha);

      setSucesso('Senha alterada com sucesso. Faça login com a nova senha.');
    } catch (falha) {
      // 400 = token inválido, expirado ou já utilizado (o FastAPI manda
      // a explicação no campo "detail"). 422 = senha curta demais.
      const { texto } = traduzirErroApi(falha, 'alterar a senha');
      setErro(texto);
    } finally {
      setEnviando(false);
    }
  };

  // O formulário só fica habilitado quando o token não foi aprovado
  // (null = não consultou, ainda não se sabe) ou foi aprovado (true).
  const formularioLiberado = tokenValido !== false;

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Definir nova senha</h2>
        <p style={styles.desc}>
          Informe o token recebido e escolha a nova senha.
        </p>

        {/* Mensagem de erro (validação local, token inválido ou erro de rede) */}
        {erro && (
          <div style={styles.avisoErro} role="alert">
            {erro}
          </div>
        )}

        {/* Mensagem de sucesso da troca de senha */}
        {sucesso && (
          <div style={styles.avisoSucesso} role="alert">
            {sucesso}
          </div>
        )}

        {/* Aviso exibido quando a consulta de validade (useEffect acima)
            confirmou que o token venceu ou já foi usado. O formulário
            fica bloqueado porque nenhuma senha nova resolveria o erro. */}
        {tokenValido === false && (
          <div style={styles.avisoErro} role="alert">
            Este link expirou ou já foi utilizado. Peça um novo em{" "}
            <Link to="/esqueceu-senha">Esqueceu a senha</Link>.
          </div>
        )}

        {/* Campo do token de redefinição.
            Vem preenchido quando o usuário chegou pelo link com
            "?token=..." — basta colar à mão se o link não funcionar. */}
        <div style={styles.inputGroup}>
          <label htmlFor="token">Token de redefinição</label>
          <input
            id="token"
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            required
            disabled={!formularioLiberado}
            style={styles.input}
          />
        </div>

        {/* Campo da nova senha.
            O minLength do HTML é uma primeira barreira do navegador;
            a regra real é a do backend (SENHA_MINIMO_CARACTERES). */}
        <div style={styles.inputGroup}>
          <label htmlFor="novaSenha">Nova senha</label>
          <input
            id="novaSenha"
            type="password"
            name="novaSenha"
            minLength={6}
            value={formData.novaSenha}
            onChange={handleChange}
            required
            disabled={!formularioLiberado}
            style={styles.input}
          />
        </div>

        {/* Campo de confirmação da nova senha */}
        <div style={styles.inputGroup}>
          <label htmlFor="confirmarSenha">Confirmar a nova senha</label>
          <input
            id="confirmarSenha"
            type="password"
            name="confirmarSenha"
            minLength={6}
            value={formData.confirmarSenha}
            onChange={handleChange}
            required
            disabled={!formularioLiberado}
            style={styles.input}
          />
        </div>

        {/* Botão de envio */}
        <button type="submit" disabled={enviando || !formularioLiberado} style={styles.button}>
          {enviando ? 'Salvando...' : 'Salvar nova senha'}
        </button>

        {/* Link de retorno: após o sucesso vai para o login, antes disso
            permite gerar um token novo caso o atual não sirva. */}
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
