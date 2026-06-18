from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    # Discord OAuth
    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    DISCORD_REDIRECT_URI: str = "http://localhost:3000/api/auth/callback"

    # Frontend base URL — used for redirects after OAuth.
    # MUST be the canonical www host: apex (fightdata.app) 307-redirects to www,
    # and that apex→www bounce mid-OAuth-chain triggers ERR_HTTP2_PROTOCOL_ERROR
    # ("This page couldn't load") in browsers due to HTTP/2 connection coalescing.
    FRONTEND_URL: str = "https://www.fightdata.app"

    # JWT — generate with: python -c "import secrets; print(secrets.token_hex(32))"
    JWT_SECRET: str = "change-me-in-production"

    # Optional: a Discord webhook URL to mirror site feedback into a channel.
    # Leave empty and feedback is still stored in the database.
    FEEDBACK_DISCORD_WEBHOOK: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
