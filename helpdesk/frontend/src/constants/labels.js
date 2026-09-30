// ============================================
// CONSTANTES E RÓTULOS DO SISTEMA
// ============================================
// O backend devolve os enums em CAIXA ALTA (StatusEnum e PrioridadeEnum em
// app/models/ticket.py), mas a interface fala português com Title Case.
// Concentrar a tradução aqui evita fazer isso espalhado por todas as páginas.

// Rótulos amigáveis para o status de um chamado
// Chave = valor do StatusEnum no banco; valor = texto exibido na tela.
export const STATUS_LABEL = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

// Ordem em que os status aparecem nos <select> e na tabela
// (segue a ordem natural do atendimento: aberto -> em andamento -> concluído).
export const STATUS_OPCOES = ['ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];

// Rótulos amigáveis para a prioridade de um chamado
export const PRIORIDADE_LABEL = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
};

// Ordem exibida no <select> de prioridade, da menos para a mais urgente.
export const PRIORIDADE_OPCOES = ['BAIXA', 'MEDIA', 'ALTA'];

// Cores do badge de status, para diferenciar de relance na tabela
// São classes do Bootstrap: fundo na cor, texto branco.
export const STATUS_COR = {
  ABERTO: 'text-bg-warning',       // Amarelo: aguardando atendimento
  EM_ANDAMENTO: 'text-bg-info',    // Azul: técnico trabalhando
  CONCLUIDO: 'text-bg-success',    // Verde: finalizado com sucesso
  CANCELADO: 'text-bg-secondary',  // Cinza: encerrado sem solução
};

// Tipos de problema aceitos pelo backend (ticket_schema.py)
// O backend NÃO valida esse campo como enum: ele apenas exige que a
// string seja enviada. "valor" é o que vai no corpo da requisição
// (campo tipo_problema) e "rotulo" é o texto mostrado no <select>.
export const TIPOS_PROBLEMA = [
  { valor: 'duvida', rotulo: 'Dúvida' },
  { valor: 'defeito', rotulo: 'Defeito / mau funcionamento' },
];

// Converte a data ISO do backend (ex.: "2026-09-26T19:33:30.450456")
// para o formato brasileiro dd/mm/aaaa.
// Retorna "—" se a data vier vazia ou inválida, para não quebrar a tabela.
export function formatarData(iso) {
  // Sem valor, não há o que formatar: devolve o traço de "vazio".
  if (!iso) return '—';

  // O backend envia ISO 8601; o construtor Date sabe interpretá-lo.
  const data = new Date(iso);

  // "Invalid Date" acontece com texto fora do padrão (ex.: "abc" ou "").
  if (Number.isNaN(data.getTime())) return '—';

  // Formato curto do português do Brasil: 26/09/2026.
  return data.toLocaleDateString('pt-BR');
}

// Converte a data ISO para "dd/mm/aaaa hh:mm" (usada em detalhes de chamado)
export function formatarDataHora(iso) {
  if (!iso) return '—';

  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return '—';

  // toLocaleString inclui a hora; toLocaleDateString, não.
  return data.toLocaleString('pt-BR');
}

// Monta os quatro contadores do dashboard a partir da lista de chamados.
// O backend não tem endpoint de estatísticas, então a contagem é feita aqui.
// "cancelado" não entra em nenhum contador, por isso os quatro cards fecham.
//
// Devolve: { total, pendentes, emAndamento, concluidos }
export function contarChamados(chamados) {
  return {
    total: chamados.length,  // Todos os chamados visíveis para o usuário
    pendentes: chamados.filter((c) => c.status === 'ABERTO').length,
    emAndamento: chamados.filter((c) => c.status === 'EM_ANDAMENTO').length,
    concluidos: chamados.filter((c) => c.status === 'CONCLUIDO').length,
  };
}

// ------------------------------------------------------------
// SENHA
// ------------------------------------------------------------
// Tamanho mínimo da senha. O valor é uma CÓPIA do que o backend exige
// (SENHA_MINIMO_CARACTERES em app/config.py, padrão 6): aqui serve só
// para dar o retorno rápido na tela, sem gastar uma ida ao servidor.
// Se o backend mudar a regra, este número precisa ser atualizado junto —
// o backend continua sendo quem decide de verdade.
export const SENHA_MINIMO_CARACTERES = 6;

// Mensagem de erro usada quando a senha não atinge o mínimo.
export const ERRO_SENHA_CURTA = `A senha precisa ter ao menos ${SENHA_MINIMO_CARACTERES} caracteres.`;

// Confere se a senha nova tem tamanho suficiente.
// Usada tanto no cadastro (Cadastro.jsx) quanto na redefinição
// (RedefinirSenha.jsx), para os dois formulários cobrarem a mesma coisa.
export function senhaAtendeTamanho(senha) {
  return Boolean(senha) && senha.trim().length >= SENHA_MINIMO_CARACTERES;
}

// ------------------------------------------------------------
// ÍCONES DE SERVIÇO
// ------------------------------------------------------------
// O campo "icone" do serviço é o nome de uma classe do Bootstrap Icons
// (ex.: "bi-easel"), usada no card da tela inicial (pages/Home.jsx).
//
// Em vez de o técnico ter que lembrar o nome exato da classe, esta lista
// oferece as opções mais comuns. Nada impede digitar uma classe fora
// daqui: o campo do formulário aceita texto livre, e o backend só exige
// que "icone" seja uma string (app/schemas/servico_schema.py).
//
// O formato de cada item:
//   { valor, rotulo }  ->  "valor" vai no banco, "rotulo" aparece no <select>.
export const ICONES_SERVICO = [
  { valor: 'bi-easel', rotulo: 'Equipamentos (monitor, notebook)' },
  { valor: 'bi-tools', rotulo: 'Manutenção' },
  { valor: 'bi-cpu', rotulo: 'Suporte de TI' },
  { valor: 'bi-wifi', rotulo: 'Rede / internet' },
  { valor: 'bi-printer', rotulo: 'Impressão' },
  { valor: 'bi-envelope', rotulo: 'E-mail' },
  { valor: 'bi-people', rotulo: 'Usuários / contas' },
  { valor: 'bi-building', rotulo: 'Predial / estrutura' },
  { valor: 'bi-mortarboard', rotulo: 'Treinamento' },
  { valor: 'bi-file-earmark-text', rotulo: 'Documentos / contratos' },
  { valor: 'bi-database', rotulo: 'Banco de dados' },
  { valor: 'bi-shield-lock', rotulo: 'Segurança' },
  { valor: 'bi-sliders', rotulo: 'Configuração' },
  { valor: 'bi-plug', rotulo: 'Outros' },
];
