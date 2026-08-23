"""
Converts text chunks into vector embeddings using fastembed - a
lightweight, ONNX-runtime-based library instead of sentence-transformers
+ PyTorch. This is a deliberate choice for deployment: PyTorch alone
typically needs 400-800MB of RAM just to load, which blows straight
past Render's free-tier 512MB limit. fastembed produces equivalent
quality embeddings (same MiniLM-family model) using ONNX Runtime, which
has a far smaller memory footprint and no PyTorch dependency at all.
"""

from fastembed import TextEmbedding
from config import settings

_model = None


def get_embedding_model() -> TextEmbedding:
    """Loads the model once and reuses it (loading is the slow part)."""
    global _model
    if _model is None:
        _model = TextEmbedding(model_name=settings.embedding_model)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embeds a batch of strings. Used for both chunks and user queries."""
    model = get_embedding_model()
    embeddings = list(model.embed(texts))
    return [e.tolist() for e in embeddings]