from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    debug: bool = False
    gemini_api_key: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
