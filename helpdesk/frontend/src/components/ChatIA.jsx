// ============================================
// CHAT DE DÚVIDAS COM IA
// ============================================
// Widget flutuante exibido em todas as telas internas (SidebarLayout).
// As mensagens ficam apenas no estado do componente: não são persistidas.
// O backend aplica autenticação, limites e autorização de contexto.

import { useEffect, useRef, useState } from 'react';
import { iaService } from '../services/iaService';

const MENSAGEM_INICIAL = {
  papel: 'assistant',
  conteudo:
    'Olá! Sou o assistente virtual do HelpDesk. Posso tirar dúvidas sobre chamados, status, prioridade, unidades e senha. Como posso ajudar?',
};

const SUGESTOES = [
  'Como abro um chamado?',
  'O que significa cada status?',
  'Como a prioridade é definida?',
  'Como redefinir minha senha?',
];

export const ChatIA = () => {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([MENSAGEM_INICIAL]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [modoBasico, setModoBasico] = useState(false);

  const fimMensagensRef = useRef(null);
  const campoRef = useRef(null);

  useEffect(() => {
    iaService
      .status()
      .then((status) => setModoBasico(!status.ia_configurada))
      .catch(() => setModoBasico(false));
  }, []);

  useEffect(() => {
    if (!aberto) return;
    fimMensagensRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, aberto, enviando]);

  useEffect(() => {
    if (aberto) campoRef.current?.focus();
  }, [aberto]);

  const enviar = async (textoForcado) => {
    const pergunta = (textoForcado ?? texto).trim();

    if (!pergunta || enviando) return;

    const historico = mensagens.map(({ papel, conteudo }) => ({ papel, conteudo }));

    setMensagens((anteriores) => [
      ...anteriores,
      { papel: 'user', conteudo: pergunta },
    ]);
    setTexto('');
    setErro('');
    setEnviando(true);

    try {
      const resposta = await iaService.chat(pergunta, historico);

      setMensagens((anteriores) => [
        ...anteriores,
        { papel: 'assistant', conteudo: resposta.resposta },
      ]);
    } catch (falha) {
      setErro(
        falha?.response?.data?.detail ||
          'Não foi possível falar com o assistente agora. Tente novamente.',
      );
    } finally {
      setEnviando(false);
    }
  };

  const aoTeclar = (evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      enviar();
    }
  };

  const mostrarSugestoes = mensagens.length === 1 && !enviando;

  return (
    <div
      className="position-fixed bottom-0 end-0 m-3 d-flex flex-column align-items-end"
      style={{ zIndex: 1040 }}
    >
      {aberto && (
        <div
          className="card shadow-lg mb-2 border-secondary"
          style={{ width: '380px', maxWidth: 'calc(100vw - 2rem)' }}
          role="dialog"
          aria-label="Assistente virtual"
        >
          <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center py-2">
            <span className="fw-bold">
              <i className="bi bi-robot me-2"></i>
              Assistente IA
            </span>

            <div className="d-flex align-items-center gap-2">
              {modoBasico && (
                <span className="badge text-bg-light" title="IA generativa não configurada">
                  modo básico
                </span>
              )}
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Fechar assistente"
                onClick={() => setAberto(false)}
              ></button>
            </div>
          </div>

          <div
            className="card-body p-2 bg-light"
            style={{ height: '55vh', maxHeight: '420px', overflowY: 'auto' }}
          >
            {mensagens.map((mensagem, indice) => (
              <div
                key={`${mensagem.papel}-${indice}`}
                className={`d-flex mb-2 ${
                  mensagem.papel === 'user'
                    ? 'justify-content-end'
                    : 'justify-content-start'
                }`}
              >
                <div
                  className={`p-2 rounded small ${
                    mensagem.papel === 'user'
                      ? 'bg-secondary text-white'
                      : 'bg-white border'
                  }`}
                  style={{
                    maxWidth: '85%',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {mensagem.conteudo}
                </div>
              </div>
            ))}

            {enviando && (
              <div className="text-muted small fst-italic mb-2">Digitando...</div>
            )}

            {erro && (
              <div className="alert alert-danger py-1 px-2 small mb-2" role="alert">
                {erro}
              </div>
            )}

            <div ref={fimMensagensRef} />
          </div>

          <div className="card-footer bg-white">
            {mostrarSugestoes && (
              <div className="d-flex flex-wrap gap-1 mb-2">
                {SUGESTOES.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    className="btn btn-outline-secondary btn-sm rounded-pill"
                    onClick={() => enviar(sugestao)}
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            )}

            <form
              className="d-flex gap-2"
              onSubmit={(evento) => {
                evento.preventDefault();
                enviar();
              }}
            >
              <textarea
                ref={campoRef}
                className="form-control form-control-sm"
                rows={1}
                placeholder="Digite sua dúvida..."
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                onKeyDown={aoTeclar}
                maxLength={2000}
                disabled={enviando}
                aria-label="Mensagem para o assistente"
              />

              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={enviando || !texto.trim()}
                aria-label="Enviar mensagem"
              >
                <i className="bi bi-send"></i>
              </button>
            </form>

            <div className="text-muted text-center mt-1" style={{ fontSize: '0.7rem' }}>
              Respostas geradas por IA. Confirme informações importantes.
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-secondary rounded-circle shadow"
        style={{ width: '56px', height: '56px' }}
        onClick={() => setAberto((valor) => !valor)}
        aria-label={aberto ? 'Fechar assistente' : 'Abrir assistente'}
        aria-expanded={aberto}
      >
        <i className={`bi ${aberto ? 'bi-x-lg' : 'bi-chat-dots'} fs-4`}></i>
      </button>
    </div>
  );
};
