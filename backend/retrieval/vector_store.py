"""
Wraps ChromaDB so the rest of the app never has to think about the
underlying vector DB API directly.
"""

import chromadb
from config import settings
from ingestion.embedder import embed_texts

_client = None
_collection = None

COLLECTION_NAME = "os_knowledge_base"


def get_collection():
    global _client, _collection

    if _collection is None:
        _client = chromadb.CloudClient(
            api_key=settings.chroma_api_key,
            tenant=settings.chroma_tenant,
            database=settings.chroma_database,
        )

        _collection = _client.get_or_create_collection(COLLECTION_NAME)

    return _collection


def add_chunks(chunks: list[dict]):
    """
    Embeds and stores a list of {"text", "source", "page"} chunks.
    Call this once per new document/URL you add to the knowledge base.
    """
    if not chunks:
        return

    collection = get_collection()

    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    ids = [
        f"{c['source']}-{c.get('page')}-{i}-{hash(c['text']) % 100000}"
        for i, c in enumerate(chunks)
    ]

    metadatas = [
        {
            "source": c["source"],
            "page": str(c.get("page"))
        }
        for c in chunks
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )


def query_similar(query_text: str, top_k: int | None = None) -> list[dict]:
    """
    Embeds the user's question and retrieves the most similar chunks.
    """
    collection = get_collection()

    query_embedding = embed_texts([query_text])[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k or settings.top_k,
    )

    retrieved = []

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]

    for doc, meta in zip(docs, metas):
        retrieved.append(
            {
                "text": doc,
                "source": meta.get("source"),
                "page": meta.get("page"),
            }
        )

    return retrieved


def list_sources() -> list[dict]:
    """
    Returns every distinct source currently in the knowledge base along
    with a chunk count for each.
    """
    collection = get_collection()

    all_data = collection.get(include=["metadatas"])
    metadatas = all_data.get("metadatas", [])

    counts: dict[str, int] = {}

    for meta in metadatas:
        source = meta.get("source", "unknown")
        counts[source] = counts.get(source, 0) + 1

    return [
        {"source": source, "chunks": count}
        for source, count in sorted(
            counts.items(),
            key=lambda x: -x[1]
        )
    ]