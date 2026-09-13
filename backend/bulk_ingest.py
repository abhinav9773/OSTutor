"""
Bulk-ingests every PDF/DOCX in a folder at once, instead of uploading
one file at a time through the API.

Usage (from the backend/ folder, with your venv activated):

    python scripts/bulk_ingest.py
    python scripts/bulk_ingest.py --dir "C:\\path\\to\\your\\pdfs"

Keeps a small manifest file (data/ingested_manifest.json) so re-running
this script later skips files you've already ingested and only
processes new ones - safe to run again and again as you add material.
"""

import argparse
import json
import os
import sys

# Allow running this script directly (adds backend/ to the import path)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from ingestion.loader import load_pdf, load_docx
from ingestion.chunker import chunk_pages
from retrieval.vector_store import add_chunks

MANIFEST_PATH = os.path.join(settings.raw_docs_dir, "..", "ingested_manifest.json")

def load_manifest() -> dict:
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_manifest(manifest: dict):
    os.makedirs(os.path.dirname(MANIFEST_PATH), exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Bulk ingest PDFs/DOCX into the knowledge base.")
    parser.add_argument(
        "--dir",
        default=settings.raw_docs_dir,
        help="Folder containing PDFs/DOCX to ingest (default: backend/data/raw_docs)",
    )
    args = parser.parse_args()

    manifest = load_manifest()
    target_dir = args.dir

    if not os.path.isdir(target_dir):
        print(f"Directory not found: {target_dir}")
        return

    files = [
        f for f in os.listdir(target_dir)
        if f.lower().endswith((".pdf", ".docx"))
    ]

    if not files:
        print(f"No PDF/DOCX files found in {target_dir}")
        return

    new_files = [f for f in files if f not in manifest]
    skipped = len(files) - len(new_files)

    if skipped:
        print(f"Skipping {skipped} already-ingested file(s).")

    if not new_files:
        print("Nothing new to ingest.")
        return

    print(f"Found {len(new_files)} new file(s) to ingest:\n")

    total_chunks = 0
    for fname in new_files:
        path = os.path.join(target_dir, fname)
        print(f"  Processing {fname} ...", end=" ", flush=True)

        try:
            if fname.lower().endswith(".pdf"):
                pages = load_pdf(path)
            else:
                pages = load_docx(path)

            chunks = chunk_pages(pages)
            add_chunks(chunks)

            manifest[fname] = {"pages": len(pages), "chunks": len(chunks)}
            total_chunks += len(chunks)
            print(f"done ({len(pages)} pages, {len(chunks)} chunks)")
        except Exception as e:
            print(f"FAILED - {e}")

    save_manifest(manifest)
    print(f"\nDone. Added {total_chunks} new chunks across {len(new_files)} file(s).")
    print(f"Manifest updated at: {os.path.abspath(MANIFEST_PATH)}")


if __name__ == "__main__":
    main()
