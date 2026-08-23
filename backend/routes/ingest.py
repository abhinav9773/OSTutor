import os
import shutil

from fastapi import APIRouter, UploadFile, File, Depends
from pydantic import BaseModel

from config import settings
from ingestion.loader import load_pdf, load_docx, load_url
from ingestion.chunker import chunk_pages
from retrieval.vector_store import add_chunks, list_sources
from auth_deps import require_admin

router = APIRouter(prefix="/ingest", tags=["ingest"])


class UrlIngestRequest(BaseModel):
    url: str


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), user: dict = Depends(require_admin)
):
    """
    Accepts a single PDF/DOCX upload, saves it to disk, then runs the
    full ingestion pipeline: load -> chunk -> embed -> store.
    Restricted to admin accounts only (see auth_deps.require_admin).
    """
    os.makedirs(settings.raw_docs_dir, exist_ok=True)
    save_path = os.path.join(settings.raw_docs_dir, file.filename)

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if file.filename.lower().endswith(".pdf"):
        pages = load_pdf(save_path)
    elif file.filename.lower().endswith(".docx"):
        pages = load_docx(save_path)
    else:
        return {"error": "Unsupported file type. Use PDF or DOCX."}

    chunks = chunk_pages(pages)
    add_chunks(chunks)

    return {
        "filename": file.filename,
        "pages_loaded": len(pages),
        "chunks_created": len(chunks),
    }


@router.post("/url")
def ingest_url(request: UrlIngestRequest, user: dict = Depends(require_admin)):
    """
    Fetches a web page and ingests its text content the same way as an
    uploaded file. Restricted to admin accounts only.
    """
    pages = load_url(request.url)
    if not pages:
        return {"error": "Could not extract any readable text from that URL."}

    chunks = chunk_pages(pages)
    add_chunks(chunks)

    return {
        "url": request.url,
        "chunks_created": len(chunks),
    }


@router.get("/sources")
def get_sources(user: dict = Depends(require_admin)):
    """
    Lists every distinct source (filename or URL) currently in the
    knowledge base, with how many chunks came from each.
    Restricted to admin accounts only.
    """
    return list_sources()
