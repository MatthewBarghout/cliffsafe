from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    debug: bool = False
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
