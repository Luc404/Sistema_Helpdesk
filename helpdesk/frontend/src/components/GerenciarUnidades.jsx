// ============================================
// GERENCIAMENTO DE UNIDADES (perfil ADMIN)
// ============================================
// Bloco que aparece na tela do admin (pages/UnidadesAdmin.jsx) e
// permite criar, editar e remover as unidades/locais (ex.: Matriz, Filial).
//
// POR QUE ESTA PARTE SÓ EXISTE PARA O ADMIN
//   A criação/edição/remoção de unidades saiu do perfil TÉCNICO e passou
//   para o ADMIN. O backend restringe POST /unidades/, PUT /unidades/{id}
//   e DELETE /unidades/{id} ao role ADMIN (veja require_roles em
//   app/routers/unidade_router.py). Qualquer outro perfil receberia 403.
//
// O QUE CADA AÇÃO CHAMA NO BACKEND
//   criar   -> POST   /unidades/            (UnidadeCreate)
//   salvar  -> PUT    /unidades/{id}        (UnidadeUpdate, update parcial)
//   remover -> DELETE /unidades/{id}        (devolve 204, sem corpo)
//
// APÓS CADA AÇÃO a lista é recarregada: o servidor é a fonte da verdade.

import { useCallback, useState } from 'react';
import { useRequisicao } from '../hooks/useRequisicao';
import { unidadeService } from '../services/unidadeService';
import { traduzirErroApi } from '../services/erroApi';

// Componente de cadastro e edição das unidades.
export const GerenciarUnidades = () => {
  // ----- LISTA DE UNIDADES -----

  // GET /unidades/ é público, mas quem mantém a lista é o admin.
  // O erro da LISTA é renomeado para "erroLista" para não se misturar
  // com o "erro" local do formulário (problemas diferentes).
  const carregarUnidades = useCallback(() => unidadeService.listar(), []);
  const { dados: unidades, carregando, erro: erroLista, recarregar } =
    useRequisicao(carregarUnidades);

  // ----- ESTADO DO FORMULÁRIO -----

  // Id da unidade em edição. Null = o formulário está criando uma nova.
  const [editandoId, setEditandoId] = useState(null);

  // Nome digitado no formulário.
  const [nome, setNome] = useState('');

  // Erro e sucesso das AÇÕES do formulário (criar/editar/remover).
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Id da unidade sendo removida, para travar só aquele botão.
  const [removendoId, setRemovendoId] = useState(null);

  // Salva a unidade: cria se não estiver editando, atualiza se estiver.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setErro('');
    setSucesso('');

    // Validação local: o backend exige "nome" (não opcional em UnidadeCreate).
    if (!nome.trim()) {
      setErro('Informe o nome da unidade.');
      return;
    }

    setEnviando(true);

    try {
      if (editandoId) {
        await unidadeService.atualizar(editandoId, { nome: nome.trim() });
        setSucesso('Unidade atualizada com sucesso.');
      } else {
        await unidadeService.criar({ nome: nome.trim() });
        setSucesso('Unidade criada com sucesso.');
      }

      // Volta ao modo "criar" para o admin poder cadastrar outra em seguida.
      setEditandoId(null);
      setNome('');

      await recarregar();
    } catch (falha) {
      const { texto } = traduzirErroApi(falha, editandoId ? 'atualizar a unidade' : 'criar a unidade');
      setErro(texto);
    } finally {
      setEnviando(false);
    }
  };

  // Entra no modo de edição: copia o nome da unidade para o formulário.
  const iniciarEdicao = (unidade) => {
    setErro('');
    setSucesso('');
    setEditandoId(unidade.id);
    setNome(unidade.nome);
  };

  // Sai do modo de edição e limpa o formulário.
  const cancelarEdicao = () => {
    setEditandoId(null);
    setNome('');
    setErro('');
    setSucesso('');
  };

  // Remove uma unidade.
  // ATENÇÃO: a remoção pode falhar se existirem usuários ou chamados
  // vinculados a ela — a chave estrangeira impede a exclusão.
  const remover = async (unidade) => {
    setErro('');
    setSucesso('');

    const confirmado = window.confirm(
      `Remover a unidade "${unidade.nome}"?\n\nUsuários e chamados vinculados a ela não poderão ser removidos.`
    );

    if (!confirmado) return;

    setRemovendoId(unidade.id);

    try {
      await unidadeService.remover(unidade.id);
      setSucesso('Unidade removida com sucesso.');

      // Se a unidade removida estava em edição, volta o formulário ao modo "criar".
      if (editandoId === unidade.id) {
        cancelarEdicao();
      }

      await recarregar();
    } catch (falha) {
      const { texto } = traduzirErroApi(falha, 'remover a unidade');
      setErro(texto);
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <div className="card p-3 border-secondary shadow-sm mb-4">
      {/* Cabeçalho do bloco */}
      <div className="d-flex justify-content-center align-items-center text-center position-relative mb-3">
        <div>
          <h5 className="fw-bold mb-0">
            <i className="bi bi-building me-2"></i>
            Unidades
          </h5>
          <small className="text-muted">
            Locais físicos (Matriz, Filiais) usados pelos chamados e usuários.
          </small>
        </div>

        {/* Botão de limpar o formulário, escondido durante a edição. */}
        {!editandoId && unidades?.length > 0 && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill position-absolute end-0"
            onClick={() => {
              setNome('');
              setErro('');
              setSucesso('');
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* Mensagens do formulário */}
      {erro && (
        <div className="alert alert-danger py-2 small" role="alert">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="alert alert-success py-2 small" role="alert">
          {sucesso}
        </div>
      )}

      {/* ----- FORMULÁRIO DE CRIAÇÃO / EDIÇÃO ----- */}
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-9">
            <label className="form-label small fw-bold" htmlFor="unidadeNome">
              Nome
            </label>
            <input
              id="unidadeNome"
              type="text"
              className="form-control form-control-sm"
              placeholder="Ex.: Filial Centro"
              maxLength={100}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="col-md-3 d-flex gap-2">
            <button
              type="submit"
              disabled={enviando}
              className={`btn btn-sm rounded-pill px-4 fw-bold ${
                editandoId ? 'btn-warning' : 'btn-secondary'
              }`}
            >
              {enviando
                ? 'Salvando...'
                : editandoId
                  ? 'Salvar alterações'
                  : 'Cadastrar unidade'}
            </button>

            {editandoId && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                onClick={cancelarEdicao}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ----- LISTA DE UNIDADES JÁ CADASTRADAS ----- */}
      {carregando && <p className="text-muted small mb-0">Carregando unidades...</p>}

      {erroLista && (
        <div className="alert alert-warning py-2 small" role="alert">
          Não foi possível carregar a lista de unidades: {erroLista}
        </div>
      )}

      {!carregando && unidades?.length === 0 && (
        <p className="text-muted small mb-0">
          Nenhuma unidade cadastrada ainda. Use o formulário acima para criar a primeira.
        </p>
      )}

      {!carregando && unidades?.length > 0 && (
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Nome</th>
                <th style={{ width: '150px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((unidade) => (
                <tr key={unidade.id} className={editandoId === unidade.id ? 'table-warning' : ''}>
                  <td className="fw-bold">{unidade.nome}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => iniciarEdicao(unidade)}
                        aria-label={`Editar unidade ${unidade.nome}`}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => remover(unidade)}
                        disabled={removendoId === unidade.id}
                        aria-label={`Remover unidade ${unidade.nome}`}
                      >
                        {removendoId === unidade.id ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="bi bi-trash"></i>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};