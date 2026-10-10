// ============================================
// GERENCIAMENTO DE SETORES (perfil ADMIN)
// ============================================
// Bloco que aparece na tela do admin (pages/SetoresAdmin.jsx) e
// permite criar, editar e remover os setores/departamentos da empresa.
//
// POR QUE ESTA PARTE SÓ EXISTE PARA O ADMIN
//   O backend restringe POST /setores/, PUT /setores/{id} e
//   DELETE /setores/{id} ao role ADMIN (veja require_roles em
//   app/routers/setor_router.py). Qualquer outro perfil receberia 403.
//
// O QUE CADA AÇÃO CHAMA NO BACKEND
//   criar   -> POST   /setores/            (SetorCreate)
//   salvar  -> PUT    /setores/{id}        (SetorUpdate, update parcial)
//   remover -> DELETE /setores/{id}        (devolve 204, sem corpo)
//
// APÓS CADA AÇÃO a lista é recarregada: o servidor é a fonte da verdade.

import { useCallback, useState } from 'react';
import { useRequisicao } from '../hooks/useRequisicao';
import { setorService } from '../services/setorService';
import { traduzirErroApi } from '../services/erroApi';

// Componente de cadastro e edição dos setores.
export const GerenciarSetores = () => {
  // ----- LISTA DE SETORES -----

  // GET /setores/ é público, mas quem mantém a lista é o admin.
  // O erro da LISTA é renomeado para "erroLista" para não se misturar
  // com o "erro" local do formulário (problemas diferentes).
  const carregarSetores = useCallback(() => setorService.listar(), []);
  const { dados: setores, carregando, erro: erroLista, recarregar } =
    useRequisicao(carregarSetores);

  // ----- ESTADO DO FORMULÁRIO -----

  // Id do setor em edição. Null = o formulário está criando um novo.
  const [editandoId, setEditandoId] = useState(null);

  // Nome digitado no formulário.
  const [nome, setNome] = useState('');

  // Erro e sucesso das AÇÕES do formulário (criar/editar/remover).
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Id do setor sendo removido, para travar só aquele botão.
  const [removendoId, setRemovendoId] = useState(null);

  // Salva o setor: cria se não estiver editando, atualiza se estiver.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setErro('');
    setSucesso('');

    // Validação local: o backend exige "nome" (não opcional em SetorCreate).
    if (!nome.trim()) {
      setErro('Informe o nome do setor.');
      return;
    }

    setEnviando(true);

    try {
      if (editandoId) {
        await setorService.atualizar(editandoId, { nome: nome.trim() });
        setSucesso('Setor atualizado com sucesso.');
      } else {
        await setorService.criar({ nome: nome.trim() });
        setSucesso('Setor criado com sucesso.');
      }

      // Volta ao modo "criar" para o técnico poder cadastrar outro em seguida.
      setEditandoId(null);
      setNome('');

      await recarregar();
    } catch (falha) {
      const { texto } = traduzirErroApi(falha, editandoId ? 'atualizar o setor' : 'criar o setor');
      setErro(texto);
    } finally {
      setEnviando(false);
    }
  };

  // Entra no modo de edição: copia o nome do setor para o formulário.
  const iniciarEdicao = (setor) => {
    setErro('');
    setSucesso('');
    setEditandoId(setor.id);
    setNome(setor.nome);
  };

  // Sai do modo de edição e limpa o formulário.
  const cancelarEdicao = () => {
    setEditandoId(null);
    setNome('');
    setErro('');
    setSucesso('');
  };

  // Remove um setor.
  // ATENÇÃO: a remoção pode falhar se existirem usuários vinculados a ele —
  // a chave estrangeira de User impede a exclusão.
  const remover = async (setor) => {
    setErro('');
    setSucesso('');

    const confirmado = window.confirm(
      `Remover o setor "${setor.nome}"?\n\nUsuários vinculados a este setor não poderão ser removidos.`
    );

    if (!confirmado) return;

    setRemovendoId(setor.id);

    try {
      await setorService.remover(setor.id);
      setSucesso('Setor removido com sucesso.');

      // Se o setor removido estava em edição, volta o formulário ao modo "criar".
      if (editandoId === setor.id) {
        cancelarEdicao();
      }

      await recarregar();
    } catch (falha) {
      const { texto } = traduzirErroApi(falha, 'remover o setor');
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
            <i className="bi bi-diagram-3 me-2"></i>
            Setores
          </h5>
          <small className="text-muted">
            Setores que os usuários escolhem no cadastro.
          </small>
        </div>

        {/* Botão de limpar o formulário, escondido durante a edição. */}
        {!editandoId && setores?.length > 0 && (
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
            <label className="form-label small fw-bold" htmlFor="setorNome">
              Nome
            </label>
            <input
              id="setorNome"
              type="text"
              className="form-control form-control-sm"
              placeholder="Ex.: Financeiro"
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
                  : 'Cadastrar setor'}
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

      {/* ----- LISTA DE SETORES JÁ CADASTRADOS ----- */}
      {carregando && <p className="text-muted small mb-0">Carregando setores...</p>}

      {erroLista && (
        <div className="alert alert-warning py-2 small" role="alert">
          Não foi possível carregar a lista de setores: {erroLista}
        </div>
      )}

      {!carregando && setores?.length === 0 && (
        <p className="text-muted small mb-0">
          Nenhum setor cadastrado ainda. Use o formulário acima para criar o primeiro.
        </p>
      )}

      {!carregando && setores?.length > 0 && (
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Nome</th>
                <th style={{ width: '150px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {setores.map((setor) => (
                <tr key={setor.id} className={editandoId === setor.id ? 'table-warning' : ''}>
                  <td className="fw-bold">{setor.nome}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => iniciarEdicao(setor)}
                        aria-label={`Editar setor ${setor.nome}`}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => remover(setor)}
                        disabled={removendoId === setor.id}
                        aria-label={`Remover setor ${setor.nome}`}
                      >
                        {removendoId === setor.id ? (
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
