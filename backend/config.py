from pathlib import Path
from pydantic_settings import BaseSettings


# backend/
BASE_DIR = Path(__file__).resolve().parent

# os-rag-tutor/
PROJECT_DIR = BASE_DIR.parent


class Settings(BaseSettings):
    groq_api_key: str = ""
    llm_model: str = "openai/gpt-oss-120b"
    embedding_model: str = "all-MiniLM-L6-v2"

    chunk_size: int = 500
    chunk_overlap: int = 50

    top_k: int = 4

    # Always use the project-level data directory
    chroma_persist_dir: str = str(
        PROJECT_DIR / "data" / "vector_store"
    )

    raw_docs_dir: str = str(
        PROJECT_DIR / "data" / "raw_docs"
    )

    google_client_id: str = ""
    jwt_secret: str = "change-this-to-a-random-secret-in-production"

    database_url: str = str(
        PROJECT_DIR / "data" / "app.db"
    )

    class Config:
        env_file = BASE_DIR / ".env"


settings = Settings()