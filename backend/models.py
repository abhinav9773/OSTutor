"""
Two tables: a Chat belongs to one user (identified by their Google
'sub' — a stable unique ID Google guarantees never changes for that
account), and each Chat has many Messages in order.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


def new_id():
    return str(uuid.uuid4())


class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=new_id)
    user_sub = Column(String, index=True, nullable=False)
    title = Column(String, default="New chat")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    messages = relationship(
        "Message", back_populates="chat", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=new_id)
    chat_id = Column(String, ForeignKey("chats.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    chat = relationship("Chat", back_populates="messages")
