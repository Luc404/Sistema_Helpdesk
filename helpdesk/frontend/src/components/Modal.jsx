// ============================================
// MODAL (componente reutilizável)
// ============================================
// Caixa de diálogo simples usada para exibir a lista de chamados de um
// grupo (Home) e os detalhes de um chamado (ChamadosTecnico).
//
// POR QUE NÃO USAR O JS DO BOOTSTRAP
//   O projeto importa apenas o CSS do Bootstrap (veja main.jsx): o script
//   "bootstrap.bundle.js" não é carregado. Então o modal não pode depender
//   de "data-bs-toggle" / "data-bs-dismiss" — ele é aberto e fechado por
//   estado do React. As classes ".modal show d-block" e ".modal-backdrop"
//   fazem o visual, que é o mesmo do Bootstrap.
//
// FECHAR: clicando no "X", no fundo escuro (backdrop) ou apertando Esc.

import { useEffect } from 'react';

// Props:
//   titulo   -> texto do cabeçalho
//   onFechar -> chamada quando o usuário fecha o modal
//   children -> conteúdo do corpo
export const Modal = ({ titulo, onFechar, children }) => {
  // Fecha com a tecla Esc. O listener sai junto com o componente para não
  // ficar preso ao window depois que o modal some.
  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') onFechar();
    };

    window.addEventListener('keydown', aoTeclar);

    return () => window.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  return (
    <>
      {/* O "show d-block" deixa o modal visível sem depender do JS do Bootstrap. */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onMouseDown={onFechar}
      >
        {/* stopPropagation: começar o clique dentro da caixa não deve fechá-la
            (só o clique no fundo, capturado acima, fecha). */}
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header bg-secondary text-white">
              <h5 className="modal-title fw-bold">{titulo}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Fechar"
                onClick={onFechar}
              ></button>
            </div>

            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>

      {/* Fundo escuro atrás do modal. */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
};
