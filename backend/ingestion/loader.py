"""
Loads raw study material (PDFs, DOCX, and now web pages) and extracts
plain text, keeping track of which source and page each piece of text
came from.
"""

import os
import fitz  # PyMuPDF
import requests
from bs4 import BeautifulSoup
from docx import Document as DocxDocument


def load_pdf(file_path: str) -> list[dict]:
    """
    Returns a list of {"text": ..., "source": filename, "page": page_number}
    one entry per page, so page-level metadata survives into chunking.
    """
    doc = fitz.open(file_path)
    filename = os.path.basename(file_path)
    pages = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text().strip()
        if text:
            pages.append({"text": text, "source": filename, "page": page_num})
    doc.close()
    return pages


def load_docx(file_path: str) -> list[dict]:
    """
    DOCX has no native "pages", so we treat the whole document as one unit
    with page=None. Chunking will still split it into smaller pieces later.
    """
    filename = os.path.basename(file_path)
    doc = DocxDocument(file_path)
    full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    if not full_text:
        return []
    return [{"text": full_text, "source": filename, "page": None}]

def load_url(url: str) -> list[dict]:
    """
    Fetches a web page and extracts its main readable text - useful for
    pulling in man pages, GeeksforGeeks-style articles, OSTEP chapters
    hosted online, Wikipedia OS articles, etc. This is what widens the
    knowledge base beyond just files you have locally.

    Strips script/style/nav/footer clutter and returns a single entry
    with the URL itself as the "source", so citations point back to it.
    """
    headers = {"User-Agent": "Mozilla/5.0 (compatible; OS-RAG-Tutor/1.0)"}
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Strip elements that are never real content
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    text = soup.get_text(separator="\n")
    # Collapse excessive blank lines left behind by stripped tags
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    clean_text = "\n".join(lines)

    if not clean_text:
        return []

    return [{"text": clean_text, "source": url, "page": None}]


def load_directory(directory: str) -> list[dict]:
    """
    Walks a directory and loads every supported file inside it.
    Add more file types here as the knowledge base grows.
    """
    all_pages = []
    for root, _, files in os.walk(directory):
        for fname in files:
            path = os.path.join(root, fname)
            if fname.lower().endswith(".pdf"):
                all_pages.extend(load_pdf(path))
            elif fname.lower().endswith(".docx"):
                all_pages.extend(load_docx(path))
            # Skip unsupported file types silently - extend as needed
    return all_pages
