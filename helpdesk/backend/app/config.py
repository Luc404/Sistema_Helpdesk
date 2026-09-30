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

    class Config:
        # Indica de qual arquivo ler as variáveis (sobrescrevem os padrões acima).
        env_file = ".env"


# Instância única de configuração, importada em toda a aplicação.
settings = Settings()