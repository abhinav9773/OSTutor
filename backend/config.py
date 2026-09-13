"""
Centralized configuration for the OS RAG Tutor backend.
All values are pulled from environment variables (see .env.example).
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = ""
    llm_model: str = "openai/gpt-oss-120b"
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    chunk_size: int = 500
    chunk_overlap: int = 50

    top_k: int = 4

    chroma_persist_dir: str = "./data/vector_store"
    chroma_api_key: str = ""
    chroma_tenant: str = ""
    chroma_database: str = ""
    
    raw_docs_dir: str = "./data/raw_docs"

    google_client_id: str = ""
    jwt_secret: str = "change-this-to-a-random-secret-in-production"

    database_url: str = "sqlite:///./data/app.db"

    # Comma-separated list of allowed frontend origins for CORS.
    # Locally this is just Vite's dev server; in production, add your
    # deployed frontend's URL here (e.g. via an env var on your host):
    # ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
    allowed_origins: str = "http://localhost:5173"

    # Comma-separated list of email addresses allowed to upload documents
    # or ingest URLs into the knowledge base. Anyone else gets a 403 -
    # this is real backend enforcement, not just a hidden UI button.
    admin_emails: str = ""

    class Config:
        env_file = ".env"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def admin_emails_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]


settings = Settings()
