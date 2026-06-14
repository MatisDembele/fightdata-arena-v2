from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    # Discord OAuth
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    DISCORD_REDIRECT_URI: str = "http://localhost:3000/api/auth/callback"

    # JWT — generate with: python -c "import secrets; print(secrets.token_hex(32))"
    JWT_SECRET: str = "change-me-in-production"

    class Config:
        env_file = ".env"


settings = Settings()
