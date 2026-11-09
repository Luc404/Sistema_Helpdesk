# Documentação técnica do código

Este documento descreve a organização interna do HelpDesk The Robbins, o
fluxo das principais requisições e os pontos que precisam ser entendidos antes
de alterar o código.

## 1. Visão geral da arquitetura

O projeto é dividido em duas aplicações:

- `backend/`: API FastAPI, regras de negócio, banco de dados e integração com IA.
- `frontend/`: aplicação React consumida pelo navegador.

A comunicação acontece por HTTP/JSON, com autenticação JWT no header
`Authorization: Bearer <token>`. O administrador também recebe atualizações em
tempo real por WebSocket.

```text
React (services/)
   │  axios + token JWT
   ▼
FastAPI (routers/)
   │  valida com schemas/
   ▼
Services (regras de negócio)
   │  SQLAlchemy
   ▼
Banco de dados

Services de IA ──> provedor compatível com OpenAI
              └─> fallback local (regras/base de conhecimento)
```

## 2. Backend

### 2.1. Ponto de entrada: `backend/app/main.py`

A ordem de inicialização é importante:

1. Importa o `engine`, a `Base` e todos os models.
2. Executa `Base.metadata.create_all()`, que cria tabelas que ainda não existem.
3. Executa migrações leves:
   - `garantir_coluna_setor`: adiciona `users.setor_id` em bancos antigos.
   - `garantir_colunas_prioridade_ia`: adiciona as colunas de auditoria da IA.
   - `garantir_role_admin`: adiciona `ADMIN` ao enum `user_role` no PostgreSQL.
4. Executa o seed idempotente (`app/seed.py`).
5. Cria a aplicação FastAPI, configura CORS e registra os routers.

O projeto não usa Alembic. Por isso, **adicionar uma coluna no model não altera
um banco que já existe**. Toda coluna nova precisa de uma função de migração
leve em `main.py`, seguindo o padrão das funções existentes.

### 2.2. Configuração: `backend/app/config.py`

A classe `Settings` usa `pydantic-settings` e lê o arquivo `.env` do diretório
de execução. Na prática, rode o `uvicorn` de dentro de `backend/` para que o
`backend/.env` seja lido.

Grupos de configuração:

- Autenticação: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`.
- Banco: `DATABASE_URL`.
- Recuperação de senha: `PASSWORD_RESET_EXPIRE_MINUTES`, `FRONTEND_URL`.
- Administrador temporário: `MASTER_KEY`, `ADMIN_EMAIL`.
- IA: `AI_ENABLED`, `AI_API_KEY`, `AI_BASE_URL`, modelos, timeout, tokens e
  limites do chat.

A chave da IA nunca deve ir para o frontend nem para uma variável `VITE_*`.

### 2.3. Banco: `backend/app/database.py`

Define o `engine`, a `Base` do SQLAlchemy, a fábrica `SessionLocal` e a
dependência `get_db`, usada pelos routers para abrir e fechar a sessão por
requisição.

### 2.4. Models: `backend/app/models/`

Cada model representa uma tabela.

- `user.py`: usuários, papéis `USUARIO`/`TECNICO`/`ADMIN` e status da conta.
- `ticket.py`: chamados, status, prioridade e auditoria da IA.
- `servico.py`: catálogo de serviços.
- `unidade.py`: unidades físicas.
- `setor.py`: setores/departamentos.
- `ticket_copia.py`: usuários em cópia de um chamado.
- `password_reset_token.py`: tokens de recuperação de senha.
- `convidado.py`: convites de cadastro.

O model `Ticket` tem duas relações com `User` (`cliente` e `tecnico`). Por isso
as consultas que fazem JOIN com usuários precisam usar `aliased(User)` para
evitar ambiguidade.

Campos de auditoria da prioridade em `Ticket`:

- `prioridade`: valor final (`BAIXA`, `MEDIA`, `ALTA`).
- `prioridade_ia`: indica se a IA participou da decisão (`IA` ou `HIBRIDA`).
- `prioridade_confianca`: confiança entre 0 e 1.
- `prioridade_justificativa`: explicação curta.
- `prioridade_origem`: `IA`, `HIBRIDA`, `REGRA` ou `MANUAL`.
- `prioridade_classificada_em`: data/hora da classificação.

### 2.5. Schemas: `backend/app/schemas/`

Os schemas Pydantic validam a entrada e definem a saída da API.

- `ticket_schema.py`: `TicketCreate`, `TicketUpdate`, `TicketResponse` e
  `TicketDetalheResponse`.
- `ai_schema.py`: `ChatRequest`, `ChatResponse` e `IAStatusResponse`.
- Os demais schemas seguem o mesmo padrão por entidade.

`TicketCreate` **não possui** o campo `prioridade`. A prioridade é decidida no
backend. `TicketUpdate` também não possui: o técnico altera apenas status,
técnico e conteúdo.

`TicketDetalheResponse` é usado por `GET /tickets/detalhes` e devolve nomes já
resolvidos (`cliente_nome`, `servico_nome`, `unidade_nome`, `tecnico_nome`),
evitando várias requisições no frontend.

### 2.6. Services: `backend/app/services/`

Os services concentram as regras de negócio. Routers não devem montar SQL nem
decidir regras complexas.

#### `ticket_service.py`

- `query_visiveis`: regra central de visibilidade.
  - `TECNICO` e `ADMIN` veem todos.
  - `USUARIO` vê os que abriu e os que está em cópia.
- `get_tickets` e `get_tickets_detalhe`: listagens.
- `create_ticket`: recebe um `ResultadoPrioridade` já calculado e persiste o
  ticket com os campos de auditoria.
- `update_ticket`: atualização parcial; remove defensivamente qualquer tentativa
  de alterar `prioridade`.
- `can_access`: autorização por ticket, usada também pelo chat.
- `delete_ticket`: remoção com cascata das cópias.

#### `ai_service.py`

Centraliza toda a integração com IA.

- `ia_configurada()`: verifica `AI_ENABLED` e `AI_API_KEY`.
- `_cliente()`: cria preguiçosamente um `AsyncOpenAI` com `base_url`,
  `timeout` e `max_retries=0`.
- `classificar_prioridade()`: classifica por regras e pelo modelo, depois
  combina os dois resultados.
- `_classificar_por_regras()`: fallback determinístico com sinais críticos,
  sinais de impacto, serviço crítico e confiança calibrada.
- `_mesclar_com_regras()`: impede que a IA rebaixe um sinal crítico detectado
  pelas regras e usa as regras quando a IA tem baixa confiança. O resultado
  combinado recebe origem `HIBRIDA`.
- `_extrair_json()` e `_interpretar_resposta()`: parsing robusto, validação do
  enum, normalização da confiança e limite da justificativa.
- `carregar_base_conhecimento()`: lê `app/ai/base_conhecimento.md`.
- `_selecionar_trechos()`: busca por palavras e sinônimos nas seções `##` da
  base, considerando também o contexto do chamado e a pergunta anterior.
- `responder_chat()`: chama o modelo de chat com base de conhecimento e
  contexto autorizado; em falha, usa a busca local.
- `_resposta_social()`: respostas rápidas para saudações e agradecimentos.
- `_resposta_chat_por_regras()`: fallback do chat com os trechos encontrados.

O formato de prioridade esperado do modelo é:

```json
{
  "prioridade": "ALTA",
  "confianca": 0.86,
  "justificativa": "O texto indica indisponibilidade para vários usuários."
}
```

Nunca confie no texto bruto do modelo: o backend valida o enum, converte a
confiança e corta a justificativa.

### 2.7. Routers: `backend/app/routers/`

Cada arquivo agrupa endpoints de um recurso.

- `auth_router.py`: cadastro, login, chave mestre, recuperação de senha.
- `ticket_router.py`: CRUD de chamados.
- `ai_router.py`: status da IA e chat.
- `user_router.py`, `servico_router.py`, `unidade_router.py`,
  `setor_router.py`, `ticket_copia_router.py`, `convidado_router.py`.
- `ws_router.py`: WebSocket de acompanhamento.

A rota `POST /tickets/` faz o seguinte:

1. Valida serviço e unidade.
2. Chama `ai_service.classificar_prioridade`.
3. Passa o resultado para `ticket_service.create_ticket`.
4. Dispara o broadcast do WebSocket.

A rota `POST /ai/chat`:

1. Exige usuário autenticado.
2. Aplica rate limit em memória por usuário.
3. Se `ticket_id` for enviado, valida com `can_access`.
4. Limita o histórico e chama `ai_service.responder_chat`.

### 2.8. Dependências e segurança

- `dependencies.py`: `get_current_user` lê o JWT e valida o usuário ativo;
  `require_roles` restringe rotas por papel.
- `security.py`: hash de senha e criação/decodificação de JWT.
- `websocket_manager.py`: mantém as conexões e envia atualizações.

### 2.9. Seed: `backend/app/seed.py`

Executa em toda inicialização, mas é idempotente. Garante:

- unidade `Matriz`;
- setor `Suporte de TI`;
- administrador fixo (`ADMIN_EMAIL`) com senha igual à `MASTER_KEY`;
- técnicos lotados no setor de suporte.

O fluxo de chave mestre é temporário e está documentado no próprio código.

## 3. Fluxo da prioridade automática

```text
POST /tickets
  → valida serviço/unidade
  → ai_service.classificar_prioridade
       ├─ regras locais calculam sinais, prioridade e confiança
       ├─ IA configurada: modelo com rubrica + exemplos + dados do chamado
       │    ├─ resposta válida: combina IA + regras (_mesclar_com_regras)
       │    └─ erro/timeout/JSON inválido: usa resultado das regras
       └─ IA não configurada: usa resultado das regras
  → ticket_service.create_ticket
  → commit + broadcast
```

A classificação é híbrida: a IA interpreta o texto, mas as regras funcionam
como guarda-corpo. Se as regras detectarem um sinal crítico (segurança, perda
de dados, indisponibilidade ampla), a prioridade não pode ser rebaixada pela
IA. Se a IA tiver baixa confiança e as regras indicarem impacto maior, as
regras prevalecem.

A rubrica de prioridade está no prompt do serviço e segue estes princípios:

- `ALTA`: parada crítica, vários usuários, segurança/perda de dados, sem contorno.
- `MEDIA`: afeta um usuário ou poucos, bloqueia parte do trabalho, tem contorno.
- `BAIXA`: dúvida simples, informação, melhoria, sem bloqueio.

O texto do chamado é tratado como dado não confiável. O prompt orienta o modelo
a ignorar instruções embutidas na descrição. Urgência declarada pelo usuário
não é usada como critério isolado.

## 4. Fluxo do chatbot

```text
ChatIA (React)
  → POST /ai/chat
  → auth + rate limit
  → se ticket_id: can_access
  → saudação/agradecimento? resposta rápida local
  → seleção de trechos (pergunta + sinônimos + contexto + histórico)
  → IA configurada?
       ├─ sim: prompt com base + contexto + histórico limitado
       └─ não/erro: resposta por regras usando a base
  → ChatResponse { resposta, modelo, fontes }
```

O detalhe do chamado tem o botão “Perguntar à IA sobre este chamado”. Ele
fecha o modal e dispara um evento para o layout abrir o chat já com o
`ticket_id` autorizado. O backend valida o acesso antes de montar o contexto.

A base de conhecimento fica em `backend/app/ai/base_conhecimento.md`. Para
adicionar conteúdo, crie uma nova seção com `## Título` e texto em português.
Não é necessário reiniciar o servidor para o fallback, pois o arquivo é lido a
cada requisição.

O histórico enviado pelo frontend é limitado no backend:

- apenas papéis `user` e `assistant`;
- últimas `AI_CHAT_MAX_HISTORICO` mensagens;
- cada mensagem é truncada;
- o cliente não pode enviar mensagem de sistema.

## 5. Frontend

### 5.1. Estrutura

- `src/pages/`: telas por perfil (`Home`, `CriarChamado`, `ChamadosTecnico`,
  `MeusChamdadosUsuario`, `AdminHome`, `ServicosTecnico`, `Sobre`, login etc.).
- `src/components/`: componentes reutilizáveis, incluindo `Modal`,
  `DetalhesChamado` e `ChatIA`.
- `src/services/`: toda comunicação HTTP. Nenhuma página deve chamar axios
  diretamente.
- `src/hooks/`: `useRequisicao` para carregamento e `useChamadosTempoReal`.
- `src/context/`: autenticação e rotas iniciais por perfil.
- `src/constants/labels.js`: rótulos, cores, formatação de data e utilitários.

### 5.2. Comunicação com a API

`src/services/api.ts` cria a instância do axios, injeta o token em todas as
requisições e trata 401. O endereço vem de `VITE_API_URL`.

`chamadoService.ts` concentra as chamadas de chamados. A criação usa timeout de
25 segundos porque a classificação por IA pode levar alguns segundos.

`iaService.ts` chama `/ai/chat` com timeout de 30 segundos e consulta
`/ai/status`.

### 5.3. Chat

`ChatIA.jsx` é renderizado dentro de `SidebarLayout.jsx`, portanto aparece em
todas as telas internas e desaparece no logout. O estado de abertura fica no
layout e é compartilhado pelo botão flutuante e pela ilustração da sidebar. Ele:

- mantém as mensagens apenas em memória;
- envia Enter para enviar e Shift+Enter para quebrar linha;
- exibe sugestões iniciais e fontes das respostas;
- permite limpar a conversa e remover o contexto de um chamado;
- recebe um `ticketId` opcional quando aberto pelo detalhe do chamado;
- mostra “modo básico” quando não há IA generativa configurada;
- usa `white-space: pre-wrap` e nunca `dangerouslySetInnerHTML`;
- usa `z-index` abaixo do modal do Bootstrap.

### 5.4. Prioridade no frontend

- O formulário de novo chamado não tem campo de prioridade.
- `DetalhesChamado` exibe badge, origem, confiança e justificativa.
- `ChamadosTecnico` ordena por prioridade (ALTA primeiro) e exibe badge.
- A prioridade não é editável em nenhuma tela.

## 6. Modelo de dados resumido

```text
users
  id, nome, email, senha, status, role, unidade_id, setor_id

tickets
  id, titulo, descricao, status, prioridade, tipo_problema,
  cliente_id, tecnico_id, servico_id, unidade_id,
  prioridade_ia, prioridade_confianca, prioridade_justificativa,
  prioridade_origem, prioridade_classificada_em,
  data_criacao, data_atualizacao

ticket_copias
  id, ticket_id, user_id

servicos, unidades, setores
  id, nome, ...

password_reset_tokens
  id, user_id, token, expira_em, ...
```

## 7. Convenções do projeto

- Textos de interface, mensagens de erro e docstrings em português.
- Routers não acessam serviços externos diretamente; usam services.
- Services não conhecem detalhes de HTTP, exceto `HTTPException` em regras de
  negócio já consolidadas.
- Atualizações de chamado são parciais; campos nulos não sobrescrevem valores.
- A visibilidade de chamados é sempre aplicada no backend.
- Toda nova coluna exige migração leve em `main.py`.
- A IA deve sempre ter fallback e nunca impedir o fluxo principal.

## 8. Como estender

### Novo endpoint

1. Crie ou reutilize um schema em `app/schemas/`.
2. Implemente a regra em `app/services/`.
3. Crie a rota em `app/routers/`.
4. Registre o router em `app/main.py` se for um arquivo novo.
5. Proteja com `get_current_user` ou `require_roles`.
6. Atualize a documentação e teste no Swagger.

### Nova pergunta frequente no chat

1. Adicione uma seção `## Título` em `app/ai/base_conhecimento.md`.
2. Use as mesmas palavras que os usuários costumam digitar.
3. Teste com a IA desligada para validar a busca por regras.

### Novo campo no ticket

1. Adicione a coluna no model.
2. Crie a migração leve em `main.py`.
3. Adicione o campo nos schemas de resposta.
4. Inclua o campo no dicionário de `get_tickets_detalhe` se necessário.
5. Atualize o frontend e a documentação.

## 9. Validação

```bash
# Frontend
npm run lint
npm run build

# Backend
cd backend
source venv/bin/activate
python -m compileall app
uvicorn app.main:app --reload
```

Testes manuais recomendados no Swagger:

- abrir chamado com descrição crítica e conferir prioridade `ALTA`;
- abrir chamado simples e conferir `BAIXA`;
- desligar a chave da IA e confirmar fallback por regras;
- chamar `/ai/chat` autenticado e sem token;
- pedir contexto de um chamado de outro usuário e confirmar 403.

## 10. Limitações conhecidas

- Não há suíte automatizada de testes no repositório.
- O rate limit do chat é em memória e não é compartilhado entre múltiplos
  workers.
- O histórico do chat não é persistido; recarregar a página limpa a conversa.
- A busca na base de conhecimento é por palavras, não por embeddings.
- O fluxo de chave mestre do administrador é temporário.
