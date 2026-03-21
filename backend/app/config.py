from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://cliffsafe:cliffsafe@localhost:5432/cliffsafe"
    postgres_user: str = "cliffsafe"
    postgres_password: str = "cliffsafe"
    postgres_db: str = "cliffsafe"
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
