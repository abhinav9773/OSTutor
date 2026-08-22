"""
Handles all calls to the LLM (via Groq).
Every function here builds a prompt from retrieved context and asks
the model to answer strictly from that context - this is what keeps
the tutor grounded instead of hallucinating.
"""

from groq import Groq
from config import settings

_client = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def _format_context(chunks: list[dict]) -> str:
    """Turns retrieved chunks into a labeled context block for the prompt."""
    parts = []
    for c in chunks:
        label = f"[{c['source']}" + (f", p.{c['page']}]" if c.get("page") else "]")
        parts.append(f"{label}\n{c['text']}")
    return "\n\n".join(parts)


ANSWER_SYSTEM_PROMPT = (
    "You are Kernel, a warm, knowledgeable Operating Systems tutor having "
    "a real conversation with a student - not a search engine reciting "
    "results, and not a textbook dumping every related fact. You can see "
    "the recent turns of this conversation below, so resolve references "
    "like 'that', 'it', 'the second one', or 'what about X instead' using "
    "that history - don't ask the student to repeat context they already "
    "gave you earlier in this chat. Follow these rules:\n\n"
    "1. Match your reply length to the question. A quick or simple "
    "question (a definition, a yes/no, a one-line clarification, casual "
    "chat) gets a short, direct reply - 1-3 sentences, no headers, no "
    "bullet lists, no multi-paragraph structure. Save longer, structured "
    "explanations (with examples/analogies and maybe a couple of short "
    "paragraphs) ONLY for questions that genuinely need them - a concept "
    "the student is clearly trying to deeply understand, or an explicit "
    "ask to explain/elaborate in detail.\n\n"
    "2. Never pad answers with restating the question, throat-clearing "
    "intros ('That's a great question...'), or wrapping up with a "
    "summary of what you just said. Get to the point immediately.\n\n"
    "3. If the retrieved course material provided with the current "
    "question is relevant, base your answer on it. You can mention the "
    "source naturally (e.g. 'this comes up in Lecture 4...') but don't "
    "make it feel like a citation footnote, and don't over-explain when a "
    "short answer would do.\n\n"
    "4. If the retrieved material is missing, thin, or doesn't cover the "
    "question: don't just say the answer 'isn't in the context' and stop "
    "there - that's a dead end. Give a brief, honest heads-up (a clause, "
    "not a paragraph) that this isn't in their uploaded material yet, "
    "then answer from your own knowledge anyway, at the same length "
    "discipline as rule 1.\n\n"
    "5. If the question has nothing to do with Operating Systems or "
    "coursework at all, respond the way ChatGPT would to casual chat - "
    "briefly, naturally, like a person, not a lecture.\n\n"
    "6. Sound human and frank: avoid robotic hedging, repeated "
    "disclaimers, or phrases like 'the provided context does not "
    "contain'. Default to being concise; only expand when the question "
    "actually calls for depth.\n\n"
    "7. Use emoji occasionally and naturally, the way a friendly human "
    "tutor texting a student might - a single relevant emoji here and "
    "there to add warmth or emphasis. Never use more than one or two per "
    "reply, and skip them entirely for serious or purely technical "
    "answers where they'd feel out of place."
)


def _build_messages(question: str, context_chunks: list[dict], history: list[dict] | None = None) -> list[dict]:
    """
    Builds the full messages array sent to the LLM: system prompt, then
    prior turns from this chat (so the model has conversation memory),
    then the current question with its retrieved context attached.

    history is expected as a list of {"role": "user"|"assistant", "text": str},
    already trimmed to a reasonable window by the caller.
    """
    messages = [{"role": "system", "content": ANSWER_SYSTEM_PROMPT}]

    for turn in history or []:
        role = turn.get("role")
        text = turn.get("text", "")
        if role in ("user", "assistant") and text:
            messages.append({"role": role, "content": text})

    context = _format_context(context_chunks)
    context_block = (
        context if context_chunks else "(nothing relevant was retrieved from the student's uploaded material)"
    )
    current_turn = f"Retrieved course material for this question:\n{context_block}\n\nStudent's question: {question}"
    messages.append({"role": "user", "content": current_turn})

    return messages


def answer_question(question: str, context_chunks: list[dict], history: list[dict] | None = None) -> str:
    """Non-streaming version - kept for any internal/non-UI callers."""
    messages = _build_messages(question, context_chunks, history)

    client = get_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=0.5,
        max_tokens=450,
    )
    return response.choices[0].message.content


def answer_question_stream(question: str, context_chunks: list[dict], history: list[dict] | None = None):
    """
    Streaming version - yields text chunks as they arrive from Groq,
    instead of waiting for the full response. Now also conversation-aware:
    prior turns from this chat are included so the model can resolve
    references like "that" or "the second one" from earlier messages.
    """
    messages = _build_messages(question, context_chunks, history)

    client = get_client()
    stream = client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=0.5,
        max_tokens=450,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


def generate_mcqs(topic: str, context_chunks: list[dict], num_questions: int = 5) -> str:
    context = _format_context(context_chunks)
    context_block = (
        context if context_chunks else "(no closely matching material was found in the uploaded course content)"
    )

    system_prompt = (
        "You are generating exam-style multiple choice questions for an "
        "Operating Systems student. Prefer the retrieved course material "
        "below when it's relevant. If it's thin or missing for this topic, "
        "don't refuse or stall - just write solid, accurate MCQs from your "
        "own knowledge of the topic instead, so the student still gets "
        "usable practice questions. Each question needs 4 options (A-D), "
        "one correct answer marked clearly, and a one-line explanation of "
        "why it's correct."
    )
    user_prompt = (
        f"Retrieved course material:\n{context_block}\n\n"
        f"Generate {num_questions} MCQs on the topic: {topic}"
    )

    client = get_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,
    )
    return response.choices[0].message.content


def generate_viva_questions(topic: str, context_chunks: list[dict], num_questions: int = 5) -> str:
    context = _format_context(context_chunks)
    context_block = (
        context if context_chunks else "(no closely matching material was found in the uploaded course content)"
    )

    system_prompt = (
        "You are generating viva (oral exam) questions for an Operating "
        "Systems student. Prefer the retrieved course material below when "
        "it's relevant. If it's thin or missing for this topic, don't "
        "refuse or stall - just write strong conceptual viva questions from "
        "your own knowledge of the topic instead. Questions should probe "
        "real understanding, not just recall - the kind a professor would "
        "ask as a follow-up to test whether the student actually gets it."
    )
    user_prompt = (
        f"Retrieved course material:\n{context_block}\n\n"
        f"Generate {num_questions} viva questions on the topic: {topic}"
    )

    client = get_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,
    )
    return response.choices[0].message.content