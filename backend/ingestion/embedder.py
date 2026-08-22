"""
Converts text chunks into vector embeddings using a local sentence-transformers
model. This runs entirely on your machine — no API calls, no cost.
"""

from sentence_transformers import SentenceTransformer
from config import settings

_model = None


def get_embedding_model() -> SentenceTransformer:
    """Loads the model once and reuses it (loading is the slow part)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embeds a batch of strings. Used for both chunks and user queries."""
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return embeddings.tolist()
