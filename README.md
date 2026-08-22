# OS RAG Tutor

A RAG-based Operating Systems tutor. Retrieves answers from your own course
material (lecture notes, lab manuals, Linux docs, question papers) instead of
relying on a fine-tuned model — so the knowledge base grows just by adding
documents.

## Structure

```
os-rag-tutor/
├── backend/            FastAPI server — ingestion, retrieval, generation
│   ├── ingestion/       Document loading, chunking, embedding
│   ├── retrieval/       ChromaDB vector store wrapper
│   ├── generation/      LLM calls (Llama 3.3 70B via Groq)
│   ├── routes/          API endpoints
│   ├── data/            Uploaded docs + persisted vector store (gitignored)
│   ├── config.py        Central settings, reads from .env
│   └── main.py          App entrypoint
└── frontend/            React + Vite + Tailwind UI
    └── src/
        ├── components/  Sidebar, ChatPanel, SourcesPanel
        ├── api.js       Talks to the backend
        └── App.jsx       Wires everything together
```

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env and add your GROQ_API_KEY (free at console.groq.com)

uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`.

## Adding study material to the knowledge base

Upload a PDF or DOCX via the `/ingest/upload` endpoint (e.g. with curl,
Postman, or a future "upload" button in the UI):

```bash
curl -X POST http://localhost:8000/ingest/upload \
  -F "file=@/path/to/lecture4-deadlocks.pdf"
```

This loads the file, chunks it, embeds the chunks, and stores them in
ChromaDB — no restart needed, no retraining.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Make sure the backend is running first —
the frontend calls `http://localhost:8000` directly.

## Notes

- Embeddings run locally via `sentence-transformers` — free, no API needed.
- Generation uses Llama 3.3 70B through Groq's free-tier API — fast and
  good quality, but subject to Groq's rate limits.
- Swap `retrieval/vector_store.py` if you ever want to move from ChromaDB
  to FAISS — nothing else in the app needs to change.
