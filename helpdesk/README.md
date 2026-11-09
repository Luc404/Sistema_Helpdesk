# HelpDesk The Robbins

Sistema de help desk para abertura e acompanhamento de chamados de suporte.
O projeto agora conta com dois recursos de inteligência artificial:

- **Prioridade automática:** a IA lê o título, a descrição, o tipo de problema
  e o serviço para classificar o chamado em `BAIXA`, `MEDIA` ou `ALTA`. Usuário
  e técnico não escolhem mais a prioridade.
- **Assistente virtual:** um chat flutuante responde dúvidas sobre o sistema
  com base em uma base de conhecimento local e, opcionalmente, no contexto de
  um chamado autorizado.

## Principais funcionalidades

- Cadastro, login e recuperação de senha com JWT.
- Perfis `USUARIO`, `TECNICO` e `ADMIN`.
- Abertura de chamados com serviço, unidade, tipo de problema e usuários em cópia.
- Classificação híbrida de prioridade (IA + regras) com justificativa e confiança.
- Fila de atendimento do técnico ordenada por prioridade.
- Atualização de status em tempo real e painel do administrador via WebSocket.
- Gestão de unidades, setores e serviços.
- Chat de dúvidas com IA, fontes e contexto autorizado de chamados.
- Funcionamento com fallback quando a IA não está configurada ou está fora do ar.

## Tecnologias

**Backend**

- Python 3.12
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL (Neon) ou SQLite
- JWT com python-jose
- SDK `openai` para provedores compatíveis com a API da OpenAI

**Frontend**

- React 19
- Vite
- React Router
- Axios
- Bootstrap 5 e Bootstrap Icons

## Estrutura do repositório

```text
helpdesk/
├── backend/
│   ├── app/
│   │   ├── ai/                  # Base de conhecimento do chatbot
│   │   ├── models/              # Tabelas do SQLAlchemy
│   │   ├── routers/             # Endpoints FastAPI
│   │   ├── schemas/             # Validação de entrada/saída
│   │   ├── services/            # Regras de negócio e integração com IA
│   │   ├── config.py            # Configurações e variáveis de ambiente
│   │   ├── database.py          # Conexão e sessão do banco
│   │   ├── main.py              # Ponto de entrada e migrações leves
│   │   └── seed.py              # Dados iniciais
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/          # Componentes reutilizáveis (inclui ChatIA)
│       ├── constants/           # Rótulos, cores e utilitários
│       ├── context/             # Autenticação
│       ├── hooks/               # Hooks de requisição e tempo real
│       ├── pages/               # Telas por perfil
│       └── services/            # Comunicação com a API
├── docs/
│   ├── CODIGO.md                # Documentação técnica do código
│   └── USO.md                   # Guia de instalação e uso
├── index.html
├── package.json
└── vite.config.js
```

## Como rodar rapidamente

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # ajuste banco e IA
uvicorn app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

### 2. Frontend

Na raiz do projeto:

```bash
npm install
npm run dev
```

- Interface: `http://localhost:5173`

O arquivo `.env` da raiz deve conter:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## Configuração da IA

A IA é opcional. Sem chave configurada, o sistema continua funcionando:

- a prioridade é definida por regras de fallback;
- o chat responde com busca simples na base de conhecimento.

Para ativar a IA generativa, preencha em `backend/.env`:

```env
AI_ENABLED=True
AI_API_KEY=sua-chave
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL_PRIORIDADE=llama-3.1-8b-instant
AI_MODEL_CHAT=llama-3.3-70b-versatile
```

O projeto usa o SDK da OpenAI e funciona com qualquer provedor compatível
(Groq, OpenAI, Gemini via endpoint compatível, Ollama local, OpenRouter etc.).
A chave fica somente no backend e nunca deve usar o prefixo `VITE_`.

## Perfis de acesso

| Perfil | Principais permissões |
|---|---|
| `USUARIO` | Abre chamados, acompanha os próprios chamados e os que está em cópia |
| `TECNICO` | Vê todos os chamados, altera status, gerencia serviços |
| `ADMIN` | Painel em tempo real, gestão de unidades, setores e usuários |

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/login` | Login com e-mail e senha |
| `POST` | `/auth/register` | Cadastro |
| `POST` | `/tickets/` | Abre chamado e classifica a prioridade com IA |
| `GET` | `/tickets/detalhes` | Lista chamados com nomes resolvidos |
| `PUT` | `/tickets/{id}` | Atualiza status/técnico (somente técnico) |
| `POST` | `/ai/chat` | Conversa com o assistente virtual |
| `GET` | `/ai/status` | Informa se a IA generativa está configurada |

A documentação completa dos endpoints fica disponível no Swagger.

## Documentação

- [Documentação técnica do código](docs/CODIGO.md)
- [Guia de instalação e uso](docs/USO.md)

## Comandos de validação

```bash
# Frontend
npm run lint
npm run build

# Backend
cd backend
source venv/bin/activate
python -m compileall app
```

## Segurança

- Nunca commite o arquivo `.env`.
- A chave da IA fica apenas no backend.
- O chat exige autenticação e aplica limite de mensagens por usuário.
- O contexto de chamado passado à IA respeita a mesma regra de visibilidade
  usada pelas rotas de chamados.
- Respostas do modelo são validadas antes de serem persistidas.
