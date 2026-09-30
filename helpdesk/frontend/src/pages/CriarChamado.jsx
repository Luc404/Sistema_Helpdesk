// ============================================
// TELA: ABRIR CHAMADO
// ============================================
// Formulário de abertura de chamado, disponível para os dois perfis
// (rota "/criar-chamado", atrás de RotaProtegida).
//
// Três detalhes deste formulário que valem registro:
//   - "cliente_id" NÃO é enviado. O dono do chamado é deduzido do token
//     JWT pelo backend (ticket_service.create_ticket), então não adianta
//     (e não seria seguro) mandar o id pelo corpo.
//   - Os campos do formulário guardam TEXTO; a conversão para o que a API
//     espera (id numérico, lista de ids) acontece só no envio.
//   - A unidade já vem preenchida com a do usuário logado, e as listas de
//     <select> são carregadas por três rotas diferentes: /servicos/ e
//     /unidades/ são públicas, /users/ exige token.

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from './SidebarLayout';
import { useAuth } from '../context/auth-context';
import { useRequisicao } from '../hooks/useRequisicao';
import { chamadoService } from '../services/chamadoService';
import { servicoService } from '../services/servicoService';
import { unidadeService } from '../services/unidadeService';
import { usuarioService } from '../services/usuarioService';
import { PRIORIDADE_OPCOES, PRIORIDADE_LABEL, TIPOS_PROBLEMA } from '../constants/labels';

// Página de criação de novo chamado
export const CriarChamado = () => {
  // Hook para navegação
  const navigate = useNavigate();

  // Usuário logado. Usamos a unidade dele como valor padrão do formulário
  // e para não permitir que ele abra chamado em nome de outra pessoa.
  const { usuario } = useAuth();

  // Estado do formulário. Os campos guardam TEXTO; a conversão para os
  // tipos que a API exige (id numérico, lista de ids) acontece no envio.
  // A unidade já começa preenchida com a do usuário logado, evitando que
  // ele precise selecionar a cada novo chamado.
  const [formData, setFormData] = useState(() => ({
    titulo: '',        // obrigatório pela API (TicketCreate.titulo)
    servico: '',       // vira servico_id
    unidade: usuario?.unidade_id ? String(usuario.unidade_id) : '',  // vira unidade_id
    prioridade: 'MEDIA',
    duvida: '',        // vira tipo_problema ("duvida" | "defeito")
    copias: [],        // vira copia_user_ids (array de ids)
    descricao: '',     // obrigatória pela API
  }));

  // Mensagens de erro e de envio em andamento.
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Listas que alimentam os <select>. As três rotas vêm do backend:
  // /servicos/ e /unidades/ são públicas, /users/ exige token.
  const carregarServicos = useCallback(() => servicoService.listar(), []);
  const { dados: servicos, carregando: carregandoServicos } = useRequisicao(carregarServicos);

  const carregarUnidades = useCallback(() => unidadeService.listar(), []);
  const { dados: unidades, carregando: carregandoUnidades } = useRequisicao(carregarUnidades);

  const carregarUsuarios = useCallback(() => usuarioService.listar(), []);
  const { dados: usuarios, carregando: carregandoUsuarios } = useRequisicao(carregarUsuarios);

  // Atualiza um campo do formulário a partir do "name" do input.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((anterior) => ({ ...anterior, [name]: value }));
  };

  // Adiciona ou remove um id da lista de usuários em cópia.
  const alternarCopia = (userId) => {
    setFormData((anterior) => ({
      ...anterior,
      copias: anterior.copias.includes(userId)
        ? anterior.copias.filter((id) => id !== userId)
        : [...anterior.copias, userId],
    }));
  };

  // Valida e envia o formulário de chamado.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    // Validação local: a API responderia 422, mas avisar antes
    // economiza uma ida ao servidor e dá um erro mais claro.
    if (!formData.titulo.trim()) {
      setErro('Informe o título do chamado.');
      return;
    }

    if (!formData.servico) {
      setErro('Selecione o serviço.');
      return;
    }

    if (!formData.unidade) {
      setErro('Informe a unidade.');
      return;
    }

    if (!formData.duvida) {
      setErro('Selecione se é dúvida ou defeito.');
      return;
    }

    if (!formData.descricao.trim()) {
      setErro('Descreva o chamado.');
      return;
    }

    setEnviando(true);

    try {
      // "cliente_id" não é enviado: o backend define o dono do chamado
      // a partir do token (ticket_service.create_ticket).
      await chamadoService.criar({
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        servico_id: Number(formData.servico),
        unidade_id: Number(formData.unidade),
        tipo_problema: formData.duvida,
        prioridade: formData.prioridade,
        copia_user_ids: formData.copias,
      });

      navigate('/meus-chamados');
    } catch (falha) {
      // O FastAPI devolve a explicação do erro no campo "detail".
      setErro(falha?.response?.data?.detail || 'Não foi possível abrir o chamado.');
    } finally {
      setEnviando(false);
    }
  };

  // true enquanto qualquer uma das três listas acima (serviços, unidades,
  // usuários) ainda está sendo buscada. O botão de envio fica desabilitado
  // nesse período para o usuário não enviar um chamado com <select> vazio.
  const carregandoListas = carregandoServicos || carregandoUnidades || carregandoUsuarios;

  return (
    <SidebarLayout>
      <div className="container" style={{ maxWidth: '650px' }}>
        <div className="card border-secondary shadow-sm">
          {/* Cabeçalho com ícone e título do formulário */}
          <div className="card-header bg-white text-center py-3">
            <i className="bi bi-easel fs-1 text-dark"></i>
            <h4 className="fw-bold mt-2">Abertura de chamado</h4>
          </div>

          {/* Corpo do formulário com campos de preenchimento */}
          <div className="card-body bg-secondary p-4 text-dark">
            <form onSubmit={handleSubmit}>
              {/* Exibida quando a API recusa o envio */}
              {erro && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {erro}
                </div>
              )}

              {/* Seção do título do chamado.
                  Este campo não existia no formulário original, mas é
                  obrigatório em TicketCreate.titulo. */}
              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                <label className="form-label fw-bold" htmlFor="titulo">
                  Título do chamado <span className="text-danger">*</span>
                </label>
                <input
                  id="titulo"
                  type="text"
                  name="titulo"
                  className="form-control"
                  placeholder="Resuma o problema em uma linha"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Seção de seleção de serviço.
                  O "value" precisa ser o ID do serviço, não o nome:
                  a API espera servico_id numérico. */}
              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                <label className="form-label fw-bold" htmlFor="servico">
                  Selecione o serviço <span className="text-danger">*</span>
                </label>
                <select
                  id="servico"
                  name="servico"
                  className="form-select"
                  value={formData.servico}
                  onChange={handleChange}
                  disabled={carregandoServicos}
                  required
                >
                  <option value="">{carregandoServicos ? 'Carregando...' : 'Selecione...'}</option>
                  {servicos?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seção de informações da unidade e tipo de problema */}
              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                {/* Campo: Unidade. Já vem preenchida com a unidade do
                    usuário logado (vinda do GET /auth/me), mas pode ser
                    trocada se o chamado for para outra unidade. */}
                <label className="form-label fw-bold" htmlFor="unidade">
                  Informe sua unidade <span className="text-danger">*</span>
                </label>
                <select
                  id="unidade"
                  name="unidade"
                  className="form-select mb-3"
                  value={formData.unidade}
                  onChange={handleChange}
                  disabled={carregandoUnidades}
                  required
                >
                  <option value="">
                    {carregandoUnidades ? 'Carregando...' : 'Selecione...'}
                  </option>
                  {unidades?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>

                {/* Campo: Tipo de problema.
                    A API espera o texto "duvida" ou "defeito" em minúsculo
                    (campo tipo_problema). */}
                <label className="form-label fw-bold" htmlFor="duvida">
                  Dúvida ou mau funcionamento <span className="text-danger">*</span>
                </label>
                <select
                  id="duvida"
                  name="duvida"
                  className="form-select mb-3"
                  value={formData.duvida}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione...</option>
                  {TIPOS_PROBLEMA.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.rotulo}
                    </option>
                  ))}
                </select>

                {/* Campo: Prioridade */}
                <label className="form-label fw-bold" htmlFor="prioridade">
                  Prioridade
                </label>
                <select
                  id="prioridade"
                  name="prioridade"
                  className="form-select"
                  value={formData.prioridade}
                  onChange={handleChange}
                >
                  {PRIORIDADE_OPCOES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORIDADE_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo: Usuários em cópia.
                  O formulário antigo usava um <input type="text"> com nomes
                  soltos, mas a API exige copia_user_ids (array de ids).
                  Por isso virou uma lista de checkboxes: cada clique
                  adiciona ou remove o id do array enviado. */}
              <div className="bg-white p-3 rounded mb-3 shadow-sm">
                <label className="form-label fw-bold">Usuários em cópia</label>
                <small className="text-muted d-block mb-2">
                  Marque quem deve acompanhar este chamado.
                </small>

                {carregandoUsuarios && (
                  <p className="text-muted small mb-0">Carregando usuários...</p>
                )}

                {!carregandoUsuarios && (
                  <div
                    className="border rounded p-2"
                    style={{ maxHeight: '160px', overflowY: 'auto' }}
                  >
                    {usuarios
                      // O próprio usuário não entra na lista de cópias.
                      ?.filter((u) => u.id !== usuario?.id)
                      .map((u) => (
                        <div className="form-check" key={u.id}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`copia-${u.id}`}
                            checked={formData.copias.includes(u.id)}
                            onChange={() => alternarCopia(u.id)}
                          />
                          <label className="form-check-label" htmlFor={`copia-${u.id}`}>
                            {u.nome}{' '}
                            <span className="text-muted small">({u.email})</span>
                          </label>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Seção de descrição do chamado */}
              <div className="bg-white p-3 rounded mb-4 shadow-sm">
                <label className="form-label fw-bold" htmlFor="descricao">
                  Descrição do chamado <span className="text-danger">*</span>
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  className="form-control"
                  rows={3}
                  value={formData.descricao}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              {/* Botão de envio do formulário */}
              <div className="text-center">
                <button
                  type="submit"
                  className="btn btn-light px-5 fw-bold rounded-pill shadow-sm"
                  disabled={enviando || carregandoListas}
                >
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
