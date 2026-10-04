"""App settings. Values can be overridden via .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    BOT_TOKEN: str = "123456:PUT-YOUR-BOT-TOKEN-HERE"
    FRONTEND_URL: str = "https://your-frontend-url/"
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    # Comma-separated telegram ids with admin rights
    ADMIN_IDS: str = "5236965009,8593240092"

    @property
    def admin_ids(self) -> set[int]:
        ids: set[int] = set()
        for part in self.ADMIN_IDS.split(","):
            part = part.strip()
            if part.isdigit():
                ids.add(int(part))
        return ids


settings = Settings()
