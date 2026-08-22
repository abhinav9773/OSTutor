from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from retrieval.vector_store import query_similar
from generation.llm import (
    answer_question,
    answer_question_stream,
    generate_mcqs,
    generate_viva_questions,
)

router = APIRouter(prefix="/chat", tags=["chat"])


class HistoryTurn(BaseModel):
    role: str  # "user" or "assistant"
    text: str


class QuestionRequest(BaseModel):
    question: str
    history: list[HistoryTurn] = []


class TopicRequest(BaseModel):
    topic: str
    num_questions: int = 5


# Cap how many prior turns we forward to the LLM - keeps token usage and
# latency sane. 10 turns (~5 back-and-forths) is plenty for resolving
# "that"/"it"-style references without ballooning the prompt.
MAX_HISTORY_TURNS = 10


def _trim_history(history: list[HistoryTurn]) -> list[dict]:
    trimmed = history[-MAX_HISTORY_TURNS:] if history else []
    return [{"role": h.role, "text": h.text} for h in trimmed]


@router.post("/ask")
def ask(request: QuestionRequest):
    """
    Non-streaming Q&A endpoint - kept for any callers that want the full
    answer in one response. The frontend chat UI uses /ask/stream instead
    for the live "typing" effect.
    """
    retrieved_chunks = query_similar(request.question)
    history = _trim_history(request.history)
    answer = answer_question(request.question, retrieved_chunks, history)
    return {
        "answer": answer,
        "sources": [
            {"source": c["source"], "page": c["page"]} for c in retrieved_chunks
        ],
    }


@router.post("/ask/stream")
def ask_stream(request: QuestionRequest):
    """
    Streaming Q&A endpoint - retrieves context, then streams the answer
    back as plain text chunks as the LLM generates them. Now includes
    recent conversation history so the model has memory within this chat.

    Wrapped in try/except: if Groq errors out mid-stream (rate limit,
    network blip, etc.), we yield a readable error message and let the
    generator end normally, instead of letting the exception abort the
    connection.
    """
    retrieved_chunks = query_similar(request.question)
    history = _trim_history(request.history)

    def token_stream():
        try:
            for chunk in answer_question_stream(request.question, retrieved_chunks, history):
                yield chunk
        except Exception as e:
            print(f"Streaming error: {e}")
            yield "\n\nSomething went wrong while generating this response. Please try asking again."

    return StreamingResponse(token_stream(), media_type="text/plain")


@router.post("/mcqs")
def mcqs(request: TopicRequest):
    """Generates MCQs grounded in retrieved chunks about the given topic."""
    retrieved_chunks = query_similar(request.topic, top_k=6)
    questions = generate_mcqs(request.topic, retrieved_chunks, request.num_questions)
    return {"questions": questions}


@router.post("/viva")
def viva(request: TopicRequest):
    """Generates viva questions grounded in retrieved chunks about the given topic."""
    retrieved_chunks = query_similar(request.topic, top_k=6)
    questions = generate_viva_questions(
        request.topic, retrieved_chunks, request.num_questions
    )
    return {"questions": questions}