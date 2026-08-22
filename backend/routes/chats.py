from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Chat, Message
from auth_deps import get_current_user

router = APIRouter(prefix="/chats", tags=["chats"])


class CreateChatRequest(BaseModel):
    title: str = "New chat"


class AddMessageRequest(BaseModel):
    role: str  # "user" or "assistant"
    text: str


def _chat_summary(chat: Chat) -> dict:
    return {"id": chat.id, "title": chat.title, "created_at": chat.created_at.isoformat()}


def _message_summary(msg: Message) -> dict:
    return {"role": msg.role, "text": msg.text, "created_at": msg.created_at.isoformat()}


def _get_owned_chat_or_404(db: Session, chat_id: str, user_sub: str) -> Chat:
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat or chat.user_sub != user_sub:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.get("")
def list_chats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """All chats for the logged-in user, most recent first."""
    chats = (
        db.query(Chat)
        .filter(Chat.user_sub == user["sub"])
        .order_by(Chat.created_at.desc())
        .all()
    )
    return [_chat_summary(c) for c in chats]


@router.post("")
def create_chat(
    request: CreateChatRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    chat = Chat(user_sub=user["sub"], title=request.title)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return _chat_summary(chat)


@router.get("/{chat_id}/messages")
def get_messages(
    chat_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    chat = _get_owned_chat_or_404(db, chat_id, user["sub"])
    messages = (
        db.query(Message)
        .filter(Message.chat_id == chat.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [_message_summary(m) for m in messages]


@router.post("/{chat_id}/messages")
def add_message(
    chat_id: str,
    request: AddMessageRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    chat = _get_owned_chat_or_404(db, chat_id, user["sub"])

    message = Message(chat_id=chat.id, role=request.role, text=request.text)
    db.add(message)

    # If this is the first user message and the chat still has the default
    # title, use it to name the chat — same behaviour as before, just
    # persisted server-side now.
    if chat.title == "New chat" and request.role == "user":
        chat.title = request.text[:40] + ("…" if len(request.text) > 40 else "")

    db.commit()
    db.refresh(message)
    return _message_summary(message)


@router.delete("/{chat_id}")
def delete_chat(
    chat_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    chat = _get_owned_chat_or_404(db, chat_id, user["sub"])
    db.delete(chat)
    db.commit()
    return {"deleted": True}
