"""Coordinates one chat turn.

Phase 3: replies with a stubbed answer. Retrieval, the agent and grounding
replace the stub in later phases.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

from supabase import AsyncClient

from app.chat.messages import text_from_parts
from app.chat.streaming import stream_error, stream_turn_and_persist
from app.schemas.chat import UIMessage

STUB_REPLY = (
    "This is a stubbed response. Filing search and grounded answers are not "
    "connected yet. You asked: {query}"
)


async def run_turn(
    *,
    client: AsyncClient,
    thread_id: uuid.UUID,
    user_message: UIMessage,
    thread_title: str,
) -> AsyncIterator[str]:
    query = text_from_parts(user_message.parts).strip()
    if not query:
        async for event in stream_error("User message is empty."):
            yield event
        return

    async for event in stream_turn_and_persist(
        client=client,
        thread_id=thread_id,
        user_message=user_message,
        thread_title=thread_title,
        text=STUB_REPLY.format(query=query),
    ):
        yield event