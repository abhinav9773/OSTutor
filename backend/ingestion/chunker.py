"""
Splits loaded page/document text into semantically coherent chunks.

Uses RecursiveCharacterTextSplitter, which tries to split on paragraph
breaks first, then sentences, then words — so it avoids cutting a
concept in half wherever possible.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings


def chunk_pages(pages: list[dict]) -> list[dict]:
    """
    Input: list of {"text", "source", "page"} (one per page/document)
    Output: list of {"text", "source", "page"} (one per chunk),
            small enough to embed meaningfully.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for page in pages:
        pieces = splitter.split_text(page["text"])
        for piece in pieces:
            chunks.append(
                {
                    "text": piece,
                    "source": page["source"],
                    "page": page["page"],
                }
            )
    return chunks
