// ============================================
// GERENCIAMENTO DE SERVIÇOS (perfil TÉCNICO)
// ============================================
// Bloco que aparece na tela do técnico (pages/ChamadosTecnico.jsx) e
// permite criar, editar e remover os serviços de suporte.
//
// POR QUE ESTA PARTE SÓ EXISTE PARA O TÉCNICO
//   O backend restringe POST /servicos/, PUT /servicos/{id} e
//   DELETE /servicos/{id} ao role TECNICO (veja require_roles em
//   app/routers/servico_router.py). Qualquer outro perfil receberia 403.
//   Por isso o bloco só é renderizado para o técnico — mesmo escondido,
//   a API continuaria recusando as chamadas.
//
// O QUE CADA AÇÃO CHAMA NO BACKEND
//   criar     -> POST   /servicos/            (ServicoCreate)
//   salvar    -> PUT    /servicos/{id}        (ServicoUpdate, update parcial)
//   remover   -> DELETE /servicos/{id}        (devolve 204, sem corpo)
//
// APÓS CADA AÇÃO a lista é recarregada, e não atualizada na mão: o
// servidor é a fonte da verdade e recarregar custa um GET em uma lista
// pequena. Assim a tela nunca mostra um estado que o banco não tem.

import { useCallback, useState } from 'react';
import { useRequisicao } from '../hooks/useRequisicao';
import { servicoService } from '../services/servicoService';
import { traduzirErroApi } from '../services/erroApi';
import { ICONES_SERVICO } from '../constants/labels';

// Formulário vazio, usado tanto no modo "criar" quanto quando o técnico
// decide cancelar uma edição.
const FORMULARIO_VAZIO = {
  nome: '',
  descricao: '',
  icone: '',
};

// Componente de cadastro e edição dos serviços de suporte.
export const GerenciarServicos = () => {
  // ----- LISTA DE SERVIÇOS -----

  // GET /servicos/ é público, mas quem mantém a lista é o técnico.
  // "recarregar" é chamada depois de criar/editar/remover para refletir
  // no banco a mudança recém-feita.
  //
  // O erro da LISTA é renomeado para "erroLista" de propósito: existe
  // outro "erro" abaixo, local do formulário. Deixar os dois com o mesmo
  // nome misturaria "não consegui carregar a lista" com "não consegui
  // salvar este serviço", que são problemas bem diferentes.
  const carregarServicos = useCallback(() => servicoService.listar(), []);
  const { dados: servicos, carregando, erro: erroLista, recarregar } =
    useRequisicao(carregarServicos);

  // ----- ESTADO DO FORMULÁRIO -----

  // Id do serviço em edição. Null = o formulário está criando um novo.
  // Guardar o id (e não o objeto) evita que a lista recarregada
  // sobrescreva o formulário com dados desatualizados durante a edição.
  const [editandoId, setEditandoId] = useState(null);

  // Campos do formulário.
  const [formData, setFormData] = useState(FORMULARIO_VAZIO);

  // Erro e sucesso das AÇÕES do formulário (criar/editar/remover).
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Id do serviço sendo removido, para travar só aquele botão.
  const [removendoId, setRemovendoId] = useState(null);

  // Atualiza um campo do formulário a partir do "name" do input.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((anterior) => ({ ...anterior, [name]: value }));
  };

  // Salva o serviço: cria se não estiver editando, atualiza se estiver.
  // PUT /servicos/ só existe para TÉCNICO, então um 403 aqui significa
  // que a sessão expirou ou o perfil mudou no meio da sessão.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpa os avisos da tentativa anterior.
    setErro('');
    setSucesso('');

    // Validações locais. O backend exige "nome" e "descricao" (não
    // opcionais em ServicoCreate), então avisar aqui evita uma ida ao
    // servidor para receber um 422 com a mesma informação.
    if (!formData.nome.trim()) {
      setErro('Informe o nome do serviço.');
      return;
    }

    if (!formData.descricao.trim()) {
      setErro('Descreva o serviço.');
      return;
    }

    setEnviando(true);

    try {
      if (editandoId) {
        // Update parcial: o corpo leva os campos que o técnico mudou.
        await servicoService.atualizar(editandoId, {
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          // Ícone vazio vira null no banco (o model aceita nulo).
          icone: formData.icone.trim() || null,
        });

        setSucesso('Serviço atualizado com sucesso.');
      } else {
        await servicoService.criar({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim(),
          icone: formData.icone.trim() || null,
        });

        setSucesso('Serviço criado com sucesso.');
      }

      // Volta ao modo "criar" para o técnico poder cadastrar outro em
      // seguida, sem precisar clicar em "Novo serviço".
      setEditandoId(null);
      setFormData(FORMULARIO_VAZIO);

      // Busca a lista de novo para o serviço novo/alterado aparecer.
      await recarregar();
    } catch (falha) {
      // 403 = sem permissão (perfil não é TÉCNICO);
      // 422 = campo inválido; 404 = id não existe mais.
      const { texto } = traduzirErroApi(falha, editandoId ? 'atualizar o serviço' : 'criar o serviço');

      setErro(texto);
    } finally {
      setEnviando(false);
    }
  };

  // Entra no modo de edição: copia os dados do serviço para o formulário.
  const iniciarEdicao = (servico) => {
    setErro('');
    setSucesso('');

    setEditandoId(servico.id);
    setFormData({
      nome: servico.nome,
      descricao: servico.descricao,
      // O banco guarda null quando não há ícone: o campo espera string.
      icone: servico.icone || '',
    });
  };

  // Sai do modo de edição e limpa o formulário.
  const cancelarEdicao = () => {
    setEditandoId(null);
    setFormData(FORMULARIO_VAZIO);
    setErro('');
    setSucesso('');
  };

  // Remove um serviço.
  // ATENÇÃO: a remoção pode falhar se existirem chamados abertos para
  // ele — a chave estrangeira do Ticket impede a exclusão. Nesse caso o
  // 500/404 do backend aparece na mensagem de erro abaixo.
  const remover = async (servico) => {
    setErro('');
    setSucesso('');

    // Pede confirmação: a ação não tem como desfazer e afeta os
    // <select> de serviço já usados em chamados abertos.
    const confirmado = window.confirm(
      `Remover o serviço "${servico.nome}"?\n\nChamados que já usam este serviço não poderão ser removidos.`
    );

    if (!confirmado) return;

    setRemovendoId(servico.id);

    try {
      await servicoService.remover(servico.id);

      setSucesso('Serviço removido com sucesso.');

      // Se o serviço removido era o que estava em edição, a edição dele
      // não faz mais sentido: volta o formulário para o modo "criar".
      if (editandoId === servico.id) {
        cancelarEdicao();
      }

      await recarregar();
    } catch (falha) {
      const { texto } = traduzirErroApi(falha, 'remover o serviço');

      setErro(texto);
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <div className="card p-3 border-secondary shadow-sm mb-4">
      {/* Cabeçalho do bloco, com o botão de novo serviço */}
      <div className="d-flex justify-content-center align-items-center text-center position-relative mb-3">
        <div>
          <h5 className="fw-bold mb-0">
            <i className="bi bi-tools me-2"></i>
            Serviços
          </h5>
          <small className="text-muted">
            Serviços disponíveis para os usuários abrirem chamados.
          </small>
        </div>

        {/* Botão de reiniciar o formulário.
            Escondido durante a edição, porque lá o botão principal
            do formulário já é "Cancelar edição". */}
        {!editandoId && servicos?.length > 0 && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill position-absolute end-0"
            onClick={() => {
              setFormData(FORMULARIO_VAZIO);
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

      {/* ----- FORMULÁRIO DE CRIAÇÃO / EDIÇÃO -----
          O mesmo formulário serve para os dois casos; muda apenas o
          texto do botão e a cor, definidos mais abaixo. */}
      <form onSubmit={handleSubmit} className="mb-3">
        {/* Campo: Nome do serviço.
            "maxLength" evita travar a API com um texto gigante; o campo
            id é único porque esta tela só tem um formulário. */}
        <div className="row g-2">
          <div className="col-md-4">
            <label className="form-label small fw-bold" htmlFor="servicoNome">
              Nome
            </label>
            <input
              id="servicoNome"
              type="text"
              name="nome"
              className="form-control form-control-sm"
              placeholder="Ex.: Suporte de TI"
              maxLength={100}
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo: Descrição */}
          <div className="col-md-5">
            <label className="form-label small fw-bold" htmlFor="servicoDescricao">
              Descrição
            </label>
            <input
              id="servicoDescricao"
              type="text"
              name="descricao"
              className="form-control form-control-sm"
              placeholder="Do que este serviço se charge"
              maxLength={200}
              value={formData.descricao}
              onChange={handleChange}
              required
            />
          </div>

          {/* Campo: Ícone.
              O <select> traz as opções de ICONES_SERVICO; o valor é a
              classe do Bootstrap Icons que vai para o banco e é usada
              no card da Home. */}
          <div className="col-md-3">
            <label className="form-label small fw-bold" htmlFor="servicoIcone">
              Ícone
            </label>
            <select
              id="servicoIcone"
              name="icone"
              className="form-select form-select-sm"
              value={formData.icone}
              onChange={handleChange}
            >
              {/* Primeira opção: sem ícone definido. Na Home, o card cai
                  no ícone padrão "bi-tools" quando o campo vem vazio. */}
              <option value="">Padrão</option>
              {ICONES_SERVICO.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botões de ação do formulário */}
        <div className="d-flex gap-2 mt-3">
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
                : 'Cadastrar serviço'}
          </button>

          {/* Cancelar aparece só na edição, para desfazer sem recarregar. */}
          {editandoId && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill px-4"
              onClick={cancelarEdicao}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* ----- LISTA DE SERVIÇOS JÁ CADASTRADOS -----
          Mostra o que já existe no banco, permitindo editar ou remover
          direto da linha. */}
      {carregando && <p className="text-muted small mb-0">Carregando serviços...</p>}

      {/* Erro ao LISTAR os serviços. É separado do "erro" do formulário
          acima porque é outro problema: aqui a lista é que não carregou,
          e o formulário continua utilizável. */}
      {erroLista && (
        <div className="alert alert-warning py-2 small" role="alert">
          Não foi possível carregar a lista de serviços: {erroLista}
        </div>
      )}

      {!carregando && servicos?.length === 0 && (
        <p className="text-muted small mb-0">
          Nenhum serviço cadastrado ainda. Use o formulário acima para criar o primeiro.
        </p>
      )}

      {!carregando && servicos?.length > 0 && (
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>Ícone</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th style={{ width: '150px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id} className={editandoId === servico.id ? 'table-warning' : ''}>
                  {/* Prévia do ícone. "bi-tools" é o mesmo padrão usado
                      na Home quando o serviço não tem ícone definido. */}
                  <td className="text-center">
                    <i className={`bi ${servico.icone || 'bi-tools'} fs-5`}></i>
                  </td>
                  <td className="fw-bold">{servico.nome}</td>
                  <td className="small">{servico.descricao}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-1">
                      {/* Botão editar: carrega os dados no formulário */}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => iniciarEdicao(servico)}
                        aria-label={`Editar serviço ${servico.nome}`}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      {/* Botão remover: some enquanto a requisição da
                          própria linha está em andamento. */}
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => remover(servico)}
                        disabled={removendoId === servico.id}
                        aria-label={`Remover serviço ${servico.nome}`}
                      >
                        {removendoId === servico.id ? (
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
