import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.chat.messages import text_from_parts
from app.chat.streaming import stream_text_answer, stream_turn_and_persist
from app.schemas.chat import TextPart, UIMessage


@pytest.mark.anyio
async def test_stream_text_answer_emits_start_text_and_finish() -> None:
    events = [
        event
        async for event in stream_text_answer(
            "Stubbed reply",
            message_id=str(uuid.uuid4()),
        )
    ]

    assert events[0].startswith('data: {"type":"start"')
    assert any('"type":"text-start"' in event for event in events)
    assert any('"type":"text-delta"' in event for event in events)
    assert any('"type":"text-end"' in event for event in events)
    assert events[-1].startswith('data: {"type":"finish"')
    assert all(event.endswith("\n\n") for event in events)


@pytest.mark.anyio
async def test_stream_turn_and_persist_saves_user_and_assistant_messages() -> None:
    user_message = UIMessage(role="user", parts=[TextPart(text="Hello")])
    mock_append = AsyncMock()

    with patch("app.chat.streaming.append_turn", mock_append):
        async for _ in stream_turn_and_persist(
            client=MagicMock(),
            thread_id=uuid.uuid4(),
            user_message=user_message,
            thread_title="New chat",
            text="Stubbed reply",
        ):
            pass

    mock_append.assert_awaited_once()
    kwargs = mock_append.await_args.kwargs
    assert kwargs["user_message"] is user_message
    assert text_from_parts(kwargs["assistant_message"].parts) == "Stubbed reply"