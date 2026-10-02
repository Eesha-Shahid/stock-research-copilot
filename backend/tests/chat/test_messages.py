import uuid

import pytest
from fastapi import HTTPException

from app.chat.messages import (
    build_assistant_message,
    extract_last_user_message,
    row_to_ui_message,
    text_from_parts,
    title_from_user_message,
    ui_message_to_insert,
)
from app.schemas.chat import TextPart, UIMessage


def test_text_from_parts_joins_text_segments() -> None:
    parts = [
        TextPart(text="Hello "),
        TextPart(text="world"),
    ]
    assert text_from_parts(parts) == "Hello world"


def test_extract_last_user_message_returns_latest_user() -> None:
    messages = [
        UIMessage(role="user", parts=[TextPart(text="First")]),
        UIMessage(role="assistant", parts=[TextPart(text="Reply")]),
        UIMessage(role="user", parts=[TextPart(text="Second")]),
    ]
    result = extract_last_user_message(messages)
    assert text_from_parts(result.parts) == "Second"


def test_extract_last_user_message_raises_when_missing() -> None:
    messages = [
        UIMessage(role="assistant", parts=[TextPart(text="Only assistant")]),
    ]
    with pytest.raises(HTTPException) as exc_info:
        extract_last_user_message(messages)
    assert exc_info.value.status_code == 422


def test_ui_message_to_insert_maps_fields() -> None:
    thread_id = uuid.uuid4()
    message = UIMessage(
        id="client-id",
        role="user",
        parts=[TextPart(text="Hello")],
    )
    row = ui_message_to_insert(message, thread_id=thread_id, sequence=3)
    assert row["thread_id"] == str(thread_id)
    assert row["role"] == "user"
    assert row["content"] == "Hello"
    assert row["parts"] == [{"type": "text", "text": "Hello"}]
    assert row["sequence"] == 3


def test_row_to_ui_message_round_trip() -> None:
    message_id = uuid.uuid4()
    row = {
        "id": str(message_id),
        "role": "assistant",
        "content": "Saved reply",
        "parts": [{"type": "text", "text": "Saved reply"}],
        "sequence": 1,
    }
    message = row_to_ui_message(row)
    assert message.id == str(message_id)
    assert message.role == "assistant"
    assert text_from_parts(message.parts) == "Saved reply"


def test_row_to_ui_message_falls_back_to_content() -> None:
    row = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": "Legacy content",
        "parts": None,
        "sequence": 0,
    }
    message = row_to_ui_message(row)
    assert text_from_parts(message.parts) == "Legacy content"


def test_build_assistant_message_wraps_text() -> None:
    message_id = uuid.uuid4()
    message = build_assistant_message("Stubbed reply", message_id=message_id)
    assert message.id == str(message_id)
    assert message.role == "assistant"
    assert text_from_parts(message.parts) == "Stubbed reply"


def test_title_from_user_message_truncates_long_text() -> None:
    message = UIMessage(
        role="user",
        parts=[TextPart(text="x" * 300)],
    )
    title = title_from_user_message(message)
    assert len(title) == 255
    assert title.endswith("...")