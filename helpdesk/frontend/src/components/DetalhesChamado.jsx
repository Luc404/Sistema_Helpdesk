// ============================================
// DETALHES DO CHAMADO (componente reutilizável)
// ============================================
// Mostra, em um modal, todas as informações de um chamado. Usado na tela
// do técnico (pages/ChamadosTecnico.jsx) ao clicar em uma linha e também
// na Home, ao abrir um chamado a partir da lista de um grupo.
//
// Espera um objeto no formato ChamadoDetalhe (services/chamadoService.ts),
// ou seja, com os nomes ("servico_nome", "cliente_nome", "unidade_nome",
// "tecnico_nome") já resolvidos pelo backend. Recebe os dados prontos da
// lista, sem buscar de novo — a lista já traz tudo o que é preciso.

import { Modal } from './Modal';
import {
  STATUS_LABEL,
  STATUS_COR,
  PRIORIDADE_LABEL,
  TIPOS_PROBLEMA,
  formatarDataHora,
} from '../constants/labels';

// O backend guarda o tipo de problema como valor cru ("duvida", "defeito").
// Aqui ele vira o rótulo legível; se vier algo fora da lista, mostra o
// próprio valor para não esconder o dado.
const rotuloTipo = (valor) =>
  TIPOS_PROBLEMA.find((t) => t.valor === valor)?.rotulo || valor;

// Um par "rótulo -> valor". Componente pequeno para não repetir a mesma
// marcação em cada campo da grade abaixo.
const Campo = ({ rotulo, children }) => (
  <div className="col-sm-6">
    <div className="text-muted small text-uppercase fw-bold">{rotulo}</div>
    <div>{children}</div>
  </div>
);

// Props: chamado (ChamadoDetalhe) e onFechar.
export const DetalhesChamado = ({ chamado, onFechar }) => {
  // Sem chamado selecionado não há o que mostrar (o pai controla o estado).
  if (!chamado) return null;

  return (
    <Modal titulo={`Chamado #${chamado.id}`} onFechar={onFechar}>
      <div className="row g-3">
        <div className="col-12">
          <div className="text-muted small text-uppercase fw-bold">Título</div>
          <div className="fw-bold fs-5">{chamado.titulo}</div>
        </div>

        <Campo rotulo="Serviço">{chamado.servico_nome}</Campo>
        <Campo rotulo="Cliente">{chamado.cliente_nome}</Campo>
        {/* Setor de quem abriu o chamado. "—" quando o usuário não tem setor. */}
        <Campo rotulo="Setor">{chamado.cliente_setor || '—'}</Campo>
        <Campo rotulo="Unidade">{chamado.unidade_nome}</Campo>
        <Campo rotulo="Técnico">{chamado.tecnico_nome || 'Não atribuído'}</Campo>

        <Campo rotulo="Prioridade">
          {PRIORIDADE_LABEL[chamado.prioridade] || chamado.prioridade}
        </Campo>

        <Campo rotulo="Status">
          <span className={`badge ${STATUS_COR[chamado.status]}`}>
            {STATUS_LABEL[chamado.status] || chamado.status}
          </span>
        </Campo>

        <Campo rotulo="Tipo de problema">{rotuloTipo(chamado.tipo_problema)}</Campo>
        <Campo rotulo="Aberto em">{formatarDataHora(chamado.data_criacao)}</Campo>

        <div className="col-12">
          <div className="text-muted small text-uppercase fw-bold">
            Última atualização
          </div>
          <div>{formatarDataHora(chamado.data_atualizacao)}</div>
        </div>

        <div className="col-12">
          <div className="text-muted small text-uppercase fw-bold">Descrição</div>
          <div className="border rounded p-2 bg-light">{chamado.descricao}</div>
        </div>
      </div>
    </Modal>
  );
};
