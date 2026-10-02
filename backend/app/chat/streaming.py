"""AI SDK-compatible SSE streaming for assistant replies."""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator

from supabase import AsyncClient

from app.chat.messages import build_assistant_message
from app.database.chats import append_turn
from app.schemas.chat import UIMessage


def _sse_event(payload: dict[str, object]) -> str:
    return f"data: {json.dumps(payload, separators=(',', ':'), default=str)}\n\n"


async def _text_events(
    text: str,
    *,
    message_id: str,
) -> AsyncIterator[str]:
    yield _sse_event({"type": "text-start", "id": message_id})

    for word in text.split(" "):
        yield _sse_event({"type": "text-delta", "id": message_id, "delta": f"{word} "})

    yield _sse_event({"type": "text-end", "id": message_id})


async def stream_text_answer(text: str, *, message_id: str) -> AsyncIterator[str]:
    yield _sse_event({"type": "start", "messageId": message_id})

    async for event in _text_events(text, message_id=message_id):
        yield event

    yield _sse_event({"type": "finish"})


async def stream_error(error_text: str) -> AsyncIterator[str]:
    yield _sse_event({"type": "error", "errorText": error_text})


async def stream_turn_and_persist(
    *,
    client: AsyncClient,
    thread_id: uuid.UUID,
    user_message: UIMessage,
    thread_title: str,
    text: str,
) -> AsyncIterator[str]:
    message_id = uuid.uuid4()
    assistant_message = build_assistant_message(text, message_id=message_id)

    try:
        async for event in stream_text_answer(text, message_id=str(message_id)):
            yield event
    finally:
        await append_turn(
            client,
            thread_id=thread_id,
            user_message=user_message,
            assistant_message=assistant_message,
            thread_title=thread_title,
        )