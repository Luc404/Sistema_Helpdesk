# Guia de instalação e uso

Este guia explica como preparar o ambiente, configurar o banco e a IA, rodar o
HelpDesk The Robbins e usar as funcionalidades no dia a dia.

## 1. Pré-requisitos

- Python 3.12 ou superior.
- Node.js 20 ou superior e npm.
- PostgreSQL (recomendado) ou SQLite para desenvolvimento.
- Uma chave de um provedor de IA compatível com a API da OpenAI (opcional).

Sem chave de IA o sistema funciona em modo de fallback:

- prioridade classificada por regras;
- chat respondendo com busca na base de conhecimento local.

## 2. Instalação do backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

Edite `backend/.env` com os valores do seu ambiente.

### Variáveis principais

```env
SECRET_KEY=troque-por-uma-chave-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# PostgreSQL
DATABASE_URL=postgresql+psycopg2://usuario:senha@host:5432/helpdesk

# Ou SQLite local
# DATABASE_URL=sqlite:///./helpdesk.db

FRONTEND_URL=http://localhost:5173
```

Para gerar uma `SECRET_KEY` segura:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 3. Configuração da IA

As variáveis de IA ficam em `backend/.env`.

```env
AI_ENABLED=True
AI_API_KEY=sua-chave
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL_PRIORIDADE=llama-3.1-8b-instant
AI_MODEL_CHAT=llama-3.3-70b-versatile
AI_TIMEOUT_SECONDS=8
AI_MAX_TOKENS_PRIORIDADE=200
AI_MAX_TOKENS_CHAT=800
AI_TEMPERATURE=0.1
AI_CHAT_MAX_HISTORICO=10
AI_CHAT_MAX_CARACTERES=2000
AI_CHAT_MAX_POR_HORA=30
```

### Provedores compatíveis

O projeto usa o SDK `openai`, então qualquer endpoint compatível funciona.
Exemplos de `AI_BASE_URL`:

| Provedor | Exemplo de `AI_BASE_URL` |
|---|---|
| Groq | `https://api.groq.com/openai/v1` |
| OpenAI | `https://api.openai.com/v1` |
| Ollama local | `http://127.0.0.1:11434/v1` |
| Gemini (compatibilidade OpenAI) | `https://generativelanguage.googleapis.com/v1beta/openai/` |

Ajuste também o nome dos modelos conforme o provedor escolhido. A chave é
obtida no painel do próprio provedor.

### Ollama local

1. Instale e inicie o Ollama.
2. Baixe um modelo, por exemplo:
   ```bash
   ollama pull llama3.1
   ```
3. Configure:
   ```env
   AI_BASE_URL=http://127.0.0.1:11434/v1
   AI_API_KEY=ollama
   AI_MODEL_PRIORIDADE=llama3.1
   AI_MODEL_CHAT=llama3.1
   ```

### Como saber se a IA está ativa

Com o backend rodando, faça login e acesse `GET /ai/status` no Swagger. O campo
`ia_configurada` indica se há chave e IA habilitada. No chat, o selo
“modo básico” aparece quando a IA generativa não está configurada.

## 4. Instalação do frontend

Na raiz do projeto:

```bash
npm install
```

Crie ou ajuste o `.env` da raiz:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Importante: o frontend lê o `.env` da raiz. O `backend/.env` é usado apenas pelo
FastAPI.

## 5. Executando o sistema

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

Na primeira subida, o sistema cria as tabelas que faltam, executa as migrações
leves e popula os dados iniciais.

### Frontend

Em outro terminal, na raiz:

```bash
npm run dev
```

- Interface: `http://localhost:5173`

## 6. Primeiro acesso

O seed cria um administrador fixo:

- E-mail: valor de `ADMIN_EMAIL` (padrão `admin@helpdesk.com`).
- Senha: valor de `MASTER_KEY` (padrão `40028922`).

Também existe o botão de “Chave mestre” na tela de login. Ele autentica a conta
administrativa usando a `MASTER_KEY`.

Em produção, troque a `MASTER_KEY` e a senha do administrador.

## 7. Perfis e o que cada um faz

### Usuário

- Abre chamados.
- Acompanha os chamados que abriu e aqueles em que foi incluído em cópia.
- Conversa com o assistente virtual.

### Técnico

- Vê todos os chamados.
- Atualiza o status.
- Gerencia o catálogo de serviços.
- Não altera a prioridade definida pela IA.

### Administrador

- Acompanha os chamados em tempo real no painel.
- Gerencia unidades, setores e usuários.
- Pode usar o painel WebSocket.

## 8. Abrindo um chamado

1. Entre com seu usuário.
2. No menu lateral, clique em “Novo chamado”.
3. Preencha:
   - título;
   - serviço;
   - unidade;
   - tipo de problema (dúvida ou defeito);
   - descrição;
   - usuários em cópia, se necessário.
4. Clique em “Enviar”.

Não existe campo de prioridade. Após o envio, o backend classifica o chamado e
grava:

- prioridade (`BAIXA`, `MEDIA` ou `ALTA`);
- se foi a IA que definiu;
- confiança da classificação;
- justificativa;
- origem (`IA`, `HIBRIDA` ou `REGRA`).

Se a IA estiver indisponível, o chamado é criado normalmente com a prioridade
de fallback. A abertura nunca falha por causa da IA.

### Como a prioridade é decidida

A IA considera título, descrição, tipo de problema, serviço e unidade:

- **ALTA:** parada crítica, vários usuários, segurança/perda de dados, atividade
  crítica bloqueada sem contorno.
- **MÉDIA:** um usuário ou poucos afetados, prejuízo relevante, contorno
  temporário, dúvida que bloqueia tarefa.
- **BAIXA:** dúvida simples, informação, treinamento, melhoria, sem bloqueio.

A classificação é híbrida: a IA interpreta o chamado, mas regras locais
funcionam como proteção. Se houver sinal explícito de segurança, perda de dados
ou indisponibilidade ampla, a prioridade não será rebaixada pela IA. Por isso,
um chamado pode aparecer com origem `HIBRIDA`.

## 9. Acompanhando chamados

- Usuário: menu “Meus chamados”.
- Técnico: menu “Chamados Técnico”.
- Administrador: menu “Painel”.

Clique em uma linha para abrir os detalhes. Nos detalhes aparecem a prioridade,
a justificativa da IA e a confiança da classificação.

A fila do técnico é ordenada com prioridade ALTA primeiro e, dentro de cada
prioridade, pelos chamados mais recentes.

## 10. Usando o chat de dúvidas

O chat pode ser aberto pelo botão flutuante no canto inferior direito de todas
as telas internas ou pela ilustração “Help Desk Support” na barra lateral.

1. Clique no botão flutuante ou na ilustração.
2. Digite a dúvida ou escolha uma sugestão.
3. Pressione Enter para enviar ou Shift+Enter para quebrar linha.

Para perguntar sobre um chamado específico, abra os detalhes dele e clique em
“Perguntar à IA sobre este chamado”. O chat abre com o contexto autorizado e
mostra o número do chamado no cabeçalho. Use o “X” ao lado do número para
remover esse contexto.

As respostas podem exibir as seções da base de conhecimento usadas como fonte.
O botão de seta no cabeçalho limpa a conversa atual.

O chat pode responder sobre:

- como abrir um chamado;
- significado dos status;
- como a prioridade é definida;
- unidades e setores;
- redefinição de senha;
- regras de segurança e privacidade.

Limitações:

- o chat não altera chamados, prioridades, status ou permissões;
- não acessa dados de outros usuários;
- não promete prazos nem substitui o atendimento técnico;
- o histórico fica apenas na tela e é perdido ao recarregar;
- há limite de mensagens por hora por usuário.

## 11. Recuperação de senha

1. Na tela de login, clique em “Esqueceu a senha?”.
2. Informe seu e-mail.
3. O sistema gera um token de redefinição.
4. Acesse a tela de redefinição com o token.
5. Cadastre uma nova senha com pelo menos 6 caracteres.

O tempo de validade do token é configurado em
`PASSWORD_RESET_EXPIRE_MINUTES` (padrão 120 minutos).

## 12. Usando a API diretamente

### Login

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@helpdesk.com","senha":"40028922"}'
```

Guarde o `access_token` retornado.

### Abrir chamado

```bash
curl -X POST http://127.0.0.1:8000/tickets/ \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Servidor fora do ar",
    "descricao": "Todos os setores estão sem acesso ao sistema.",
    "servico_id": 1,
    "unidade_id": 1,
    "tipo_problema": "defeito",
    "copia_user_ids": []
  }'
```

Repare que `prioridade` não é enviada.

### Conversar com o assistente

```bash
curl -X POST http://127.0.0.1:8000/ai/chat \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mensagem":"Como abro um chamado?","historico":[]}'
```

Para incluir o contexto de um chamado autorizado:

```json
{
  "mensagem": "Qual o status do meu chamado?",
  "historico": [],
  "ticket_id": 12
}
```

## 13. Validação e build

```bash
# Frontend
npm run lint
npm run build

# Backend
cd backend
source venv/bin/activate
python -m compileall app
```

## 14. Problemas comuns

### Erro de conexão com o banco

- Confira `DATABASE_URL` em `backend/.env`.
- No PostgreSQL, verifique usuário, senha, host, porta e `sslmode`.
- Execute o backend de dentro da pasta `backend/` para o `.env` correto ser lido.

### Coluna não existe após atualizar o código

O projeto não usa Alembic. As migrações leves ficam em `main.py` e rodam na
inicialização. Reinicie o backend para aplicá-las. Se necessário, confira as
colunas no banco:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tickets';
```

### IA sempre em fallback

- Confira `AI_ENABLED=True`.
- Confira se `AI_API_KEY` está preenchida.
- Confira `AI_BASE_URL` e o nome dos modelos.
- Veja os logs do backend; falhas de IA são registradas com `[ai]`.
- Teste `GET /ai/status`.

### Chat retorna “modo básico”

Significa que a IA generativa não está configurada. O chat continua
respondendo com a base de conhecimento local. Preencha a chave para ativar o
modelo.

### Erro 401

Token ausente, inválido ou expirado. Faça login novamente.

### Erro 403 no chat

O `ticket_id` enviado pertence a outro usuário ou você não tem acesso a ele.

### Erro 429 no chat

Limite de mensagens por hora atingido. Aguarde ou aumente
`AI_CHAT_MAX_POR_HORA`.

### CORS

As origens permitidas estão em `main.py`. Para usar outro endereço de frontend,
inclua a origem na lista `origins`.

## 15. Deploy

### Backend

- Configure todas as variáveis de ambiente no painel do serviço.
- Use PostgreSQL em produção.
- Não envie `.env` para o repositório.
- Ajuste as origens de CORS para o domínio real do frontend.

### Frontend

- Configure `VITE_API_URL` com a URL pública do backend.
- Gere o build com `npm run build`.

## 16. Segurança e privacidade

- Nunca compartilhe a chave da IA.
- Nunca coloque a chave em variáveis `VITE_*`.
- Evite enviar dados pessoais desnecessários na descrição dos chamados.
- O chat exige autenticação e valida o acesso ao chamado antes de usar contexto.
- Respostas do modelo são tratadas como texto puro no frontend, sem HTML.
- Revise periodicamente a base de conhecimento para não incluir informações
  sensíveis.
