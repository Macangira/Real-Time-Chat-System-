from pydantic_settings import BaseSettings , SettingsConfigDict
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = ROOT_DIR /".env"

class Settings(BaseSettings):
    mongo_url : str
    db_name : str

    secret_key : str
    algorithm : str
    access_token_expire_minutes : int

    smtp_host : str
    smtp_port : int

    environment : str = "development"
    log_level :str = "INFO"
    log_file_path : str = "./logs/chat.log"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        print(f"✅ Configuration loaded from environment")

settings = Settings()