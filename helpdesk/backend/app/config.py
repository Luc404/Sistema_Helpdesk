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

    class Config:
        # Indica de qual arquivo ler as variáveis (sobrescrevem os padrões acima).
        env_file = ".env"


# Instância única de configuração, importada em toda a aplicação.
settings = Settings()