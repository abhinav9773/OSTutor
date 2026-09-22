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


def _build_retrieval_query(question: str, history: list[HistoryTurn]) -> str:
    """
    Retrieval used to only ever search on the literal current message,
    which fails badly on short follow-ups ("give me a numerical", a bare
    number, "what about that") that have almost no semantic content of
    their own. This blends in the last couple of user turns so retrieval
    is actually searching for what the student is still talking about,
    not just the fragment they just typed - this is what fixes cases
    where a terse follow-up pulled in completely unrelated material.
    """
    recent_user_turns = [h.text for h in history[-6:] if h.role == "user"]
    if recent_user_turns:
        return " ".join(recent_user_turns[-2:] + [question])
    return question


@router.post("/ask")
def ask(request: QuestionRequest):
    """
    Non-streaming Q&A endpoint - kept for any callers that want the full
    answer in one response. The frontend chat UI uses /ask/stream instead
    for the live "typing" effect.
    """
    history = _trim_history(request.history)
    retrieval_query = _build_retrieval_query(request.question, request.history)
    retrieved_chunks = query_similar(retrieval_query)
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
    back as plain text chunks as the LLM generates them. Includes recent
    conversation history both for the LLM's memory and, critically, for
    building a better retrieval query on short/ambiguous follow-ups.

    Wrapped in try/except: if Groq errors out mid-stream (rate limit,
    network blip, etc.), we yield a readable error message and let the
    generator end normally, instead of letting the exception abort the
    connection.
    """
    history = _trim_history(request.history)
    retrieval_query = _build_retrieval_query(request.question, request.history)
    retrieved_chunks = query_similar(retrieval_query)

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