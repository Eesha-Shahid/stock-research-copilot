import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.chat.orchestrator import run_turn
from app.schemas.chat import TextPart, UIMessage


@pytest.mark.anyio
async def test_run_turn_streams_stub_reply_and_persists() -> None:
    user_message = UIMessage(role="user", parts=[TextPart(text="Azure growth?")])

    with patch("app.chat.streaming.append_turn", AsyncMock()) as mock_persist:
        events = [
            event
            async for event in run_turn(
                client=MagicMock(),
                thread_id=uuid.uuid4(),
                user_message=user_message,
                thread_title="New chat",
            )
        ]

    assert any('"type":"text-delta"' in event for event in events)
    assert any("Azure" in event for event in events)
    assert events[-1].startswith('data: {"type":"finish"')
    mock_persist.assert_awaited_once()


@pytest.mark.anyio
async def test_run_turn_rejects_empty_message_without_persisting() -> None:
    user_message = UIMessage(role="user", parts=[TextPart(text="   ")])

    with patch("app.chat.streaming.append_turn", AsyncMock()) as mock_persist:
        events = [
            event
            async for event in run_turn(
                client=MagicMock(),
                thread_id=uuid.uuid4(),
                user_message=user_message,
                thread_title="New chat",
            )
        ]

    assert any('"type":"error"' in event for event in events)
    mock_persist.assert_not_awaited()