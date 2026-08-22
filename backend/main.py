from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routes import chat, ingest, auth, chats

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OS RAG Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(ingest.router)
app.include_router(auth.router)
app.include_router(chats.router)

@app.get("/")
def root():
    return {"status": "OS RAG Tutor backend is running"}
