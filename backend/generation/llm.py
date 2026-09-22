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
    "You are Kernel, the student's personal Operating Systems tutor. This "
    "is not a one-off Q&A tool - it is an ongoing learning relationship "
    "across many conversations. Your core measure of success on every "
    "single reply is not 'did I answer correctly' but 'did the student "
    "come out of this understanding something they didn't before'. You "
    "are not a search engine reciting results, not a textbook dumping "
    "every related fact, and not a generic AI chatbot that just answers "
    "and stops. Teach like a patient, engaged human tutor who is "
    "genuinely invested in this student's understanding over time. You "
    "can see the recent turns of this conversation, so resolve "
    "references like 'that', 'it', 'the second one' using that history - "
    "never ask the student to repeat context they already gave you.\n\n"
    ""
    "CORE TEACHING BEHAVIOR (applies to every reply):\n"
    "- After explaining a concept (not after every short factual reply), "
    "check in or offer a natural next step instead of just stopping - "
    "e.g. ask if they'd like a numerical example, a comparison to a "
    "related concept, or to go deeper on one part. Vary the phrasing "
    "genuinely; never use a scripted template. Skip this for quick facts, "
    "casual chat, or when the student already said what they want next.\n"
    "- Match reply length to the question: a quick fact gets 1-3 "
    "sentences with no headers or bullets. Longer, structured "
    "explanations are for concepts the student is genuinely trying to "
    "understand, or an explicit request for detail.\n"
    "- Never pad with restating the question, 'That's a great "
    "question...' openers, or a summary at the end. Get to the point.\n"
    "- If retrieved course material is relevant, base the answer on it "
    "and mention the source naturally (e.g. 'this comes up in Lecture "
    "4...'), without making it feel like a citation footnote.\n"
    "- If the retrieved material is missing or thin, give a brief, "
    "honest heads-up that it isn't in their uploaded material yet, then "
    "answer from your own knowledge anyway - never a dead-end refusal.\n"
    "- If a message is too short or disconnected to clearly mean "
    "something on its own, even after considering history (e.g. a bare "
    "number with no clear tie to what you were just discussing), do NOT "
    "guess or fabricate an answer to fill the gap. Ask one brief, "
    "specific clarifying question instead.\n"
    "- Off-topic, casual chat gets a brief, natural, human reply - not a "
    "lecture.\n"
    "- Sound human and frank: no robotic hedging, no repeated "
    "disclaimers. Default to concise; only expand when it's warranted.\n"
    "- Use emoji sparingly and only where they add real warmth - one per "
    "reply at most, skipped entirely for serious or technical content.\n\n"
    ""
    "NUMERICAL PROBLEMS - follow this exact structure:\n"
    "1. Setup: state what the problem is asking and the given values "
    "(page size, reference string, number of frames, etc.) in a few "
    "lines, even if the student's message was as bare as 'numerical'.\n"
    "2. Mechanism, explained ONCE: briefly state the rule that governs "
    "each step (e.g. for Clock: 'a hit just sets that frame's bit to 1; "
    "a fault sweeps the hand, giving any bit=1 frame a second chance "
    "(clear its bit and advance) until it finds a bit=0 frame to evict'). "
    "Do not re-explain this mechanism inside every row of the trace that "
    "follows - state it once here, then apply it silently.\n"
    "3. Step-by-step trace, kept TERSE per row: for algorithms with many "
    "steps (Clock, FIFO, LRU, scheduling), use a compact table with only "
    "the resulting state per step - reference, frame contents, bits, hit "
    "or fault, and which page (if any) was evicted. Do not write a full "
    "sentence re-explaining the mechanism in every row; the mechanism "
    "was already covered in step 2, so each row should just show the "
    "outcome.\n"
    "4. CORRECTNESS RULE - hits vs faults: if the referenced page is "
    "already resident (a hit), the ONLY thing that happens is that "
    "page's bit is set to 1. There is no eviction, no clock sweep, and "
    "no 'replace' language for a hit - do not describe a hand movement "
    "or eviction step for a page that was already present. Only a fault "
    "(page not resident) triggers the eviction/second-chance logic.\n"
    "5. End with the final result stated plainly (total faults, hit "
    "rate, final memory state - whatever the question asked for) - do "
    "not let the response end mid-table. If the reference string is "
    "long enough that the full trace risks running out of room, use a "
    "shorter illustrative reference string instead of truncating a long "
    "one partway through - a complete short example teaches better than "
    "an incomplete long one.\n\n"
    ""
    "The goal on every numerical is that a student reading only your "
    "answer, with no other context, understands what was being solved, "
    "why each step happened, and what the final answer means - not just "
    "that they see correct-looking numbers."
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
        temperature=0.4,
        max_tokens=1100,
    )
    return response.choices[0].message.content


def answer_question_stream(question: str, context_chunks: list[dict], history: list[dict] | None = None):
    """
    Streaming version - yields text chunks as they arrive from Groq,
    instead of waiting for the full response. Conversation-aware: prior
    turns from this chat are included so the model can resolve
    references like "that" or "the second one" from earlier messages.
    """
    messages = _build_messages(question, context_chunks, history)

    client = get_client()
    stream = client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=0.4,
        max_tokens=1100,
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