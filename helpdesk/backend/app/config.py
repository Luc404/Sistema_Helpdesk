# ============================================
# CONFIGURAÇÃO DO SISTEMA
# ============================================
# Carrega as variáveis de ambiente (arquivo .env) usadas pela aplicação.
# Com o pydantic-settings, basta criar o arquivo .env com as chaves abaixo
# que elas são lidas automaticamente.

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Chave secreta usada para assinar os tokens JWT.
    # Nunca exponha em produção e troque por um valor aleatório.
    SECRET_KEY: str = "helpdesk-chave-super-secreta-troque-em-producao"

    # Algoritmo de assinatura do JWT (HS256 = HMAC + SHA256).
    ALGORITHM: str = "HS256"

    # Tempo de validade do token de acesso em minutos.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # URL de conexão com o banco (o .env sobrescreve este padrão).
    DATABASE_URL: str = "sqlite:///./helpdesk.db"

    # Tempo de validade, em MINUTOS, do token gerado no fluxo
    # "esqueci minha senha". Passou disso, o token é considerado expirado
    # e a redefinição é recusada (app/services/password_reset_token_service.py).
    PASSWORD_RESET_EXPIRE_MINUTES: int = 120

    # Tamanho mínimo da senha aceito pelo fluxo de redefinição.
    # O mesmo valor é aplicado no cadastro e na troca de senha feita
    # pelo perfil técnico, para que a regra não mude de tela para tela.
    SENHA_MINIMO_CARACTERES: int = 6

    # Endereço do frontend usado para montar o link completo de
    # redefinição que aparece no e-mail ("{FRONTEND_URL}/redefinir-senha").
    FRONTEND_URL: str = "http://localhost:5173"

    # CHAVE MESTRE (FLUXO TEMPORÁRIO)
    # Chave secreta usada pelo botão "Chave mestre" do login (POST
    # /auth/master-key) para autenticar a conta de administrador fixa criada
    # pelo seed. Esse fluxo é uma solução passageira enquanto não existe um
    # primeiro acesso/convite de administrador oficial — depois deve ser
    # removido do código, junto com o botão no frontend.
    MASTER_KEY: str = "40028922"

    # E-mail da conta de administrador fixa criada pelo seed (app/seed.py).
    # O seed usa esta conta com a senha igual à MASTER_KEY, e é ela que o
    # POST /auth/master-key autentica.
    ADMIN_EMAIL: str = "admin@helpdesk.com"

    # ============================================
    # INTELIGÊNCIA ARTIFICIAL (compatível com OpenAI)
    # ============================================
    # A IA é usada para classificar a prioridade dos chamados e responder
    # ao chatbot de dúvidas. A chave fica SOMENTE aqui no backend: nunca
    # use uma variável "VITE_*" para ela, pois tudo com esse prefixo vai
    # para o navegador.
    #
    # Com AI_ENABLED=True e AI_API_KEY vazia, o sistema continua
    # funcionando em modo de fallback (regras para prioridade e busca
    # simples na base de conhecimento para o chat).
    AI_ENABLED: bool = True
    AI_API_KEY: str = ""

    # Endereço compatível com a API da OpenAI. Exemplos:
    #   Groq:     https://api.groq.com/openai/v1
    #   OpenAI:   https://api.openai.com/v1
    #   Ollama:   http://127.0.0.1:11434/v1
    #   Gemini:   https://generativelanguage.googleapis.com/v1beta/openai/
    AI_BASE_URL: str = "https://api.groq.com/openai/v1"

    # Modelos separados: um menor/rápido para classificar prioridade e um
    # mais capaz para conversar no chat.
    AI_MODEL_PRIORIDADE: str = "llama-3.1-8b-instant"
    AI_MODEL_CHAT: str = "llama-3.3-70b-versatile"

    # Tempo máximo de espera pela resposta do provedor. Mantenha abaixo do
    # timeout do axios na abertura do chamado para o fallback agir antes.
    AI_TIMEOUT_SECONDS: float = 8.0

    # Limites de geração para controlar custo e latência.
    AI_MAX_TOKENS_PRIORIDADE: int = 200
    AI_MAX_TOKENS_CHAT: int = 800
    AI_TEMPERATURE: float = 0.1

    # Limites do chat.
    AI_CHAT_MAX_HISTORICO: int = 10          # últimas N mensagens enviadas ao modelo
    AI_CHAT_MAX_CARACTERES: int = 2000       # tamanho máximo de uma pergunta
    AI_CHAT_MAX_POR_HORA: int = 30           # limite simples por usuário

    class Config:
        # Indica de qual arquivo ler as variáveis (sobrescrevem os padrões acima).
        env_file = ".env"


# Instância única de configuração, importada em toda a aplicação.
settings = Settings()