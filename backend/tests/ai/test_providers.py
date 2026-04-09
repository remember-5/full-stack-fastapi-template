from unittest.mock import patch

import pytest

from app.ai.shared.providers import (
    create_anthropic_chat_model,
    create_default_chat_model,
    create_openai_chat_model,
)


def test_create_default_chat_model_requires_openai_key() -> None:
    with (
        patch("app.ai.shared.providers.settings.LLM_PROVIDER_DEFAULT", "openai"),
        patch("app.ai.shared.providers.settings.OPENAI_API_KEY", None),
    ):
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            create_default_chat_model()


def test_create_default_chat_model_requires_anthropic_key() -> None:
    with (
        patch("app.ai.shared.providers.settings.LLM_PROVIDER_DEFAULT", "anthropic"),
        patch("app.ai.shared.providers.settings.ANTHROPIC_API_KEY", None),
    ):
        with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
            create_default_chat_model()


def test_get_chat_model_only_requires_selected_provider_key() -> None:
    with (
        patch("app.ai.shared.providers.settings.LLM_PROVIDER_DEFAULT", "openai"),
        patch("app.ai.shared.providers.settings.OPENAI_API_KEY", "test-openai-key"),
        patch("app.ai.shared.providers.settings.ANTHROPIC_API_KEY", None),
    ):
        model = create_default_chat_model()

    assert model is not None


def test_create_openai_chat_model_uses_custom_base_url() -> None:
    with (
        patch("app.ai.shared.providers.settings.OPENAI_API_KEY", "test-openai-key"),
        patch(
            "app.ai.shared.providers.settings.OPENAI_BASE_URL",
            "https://openai.example.com/v1",
        ),
    ):
        model = create_openai_chat_model()

    assert model.openai_api_base == "https://openai.example.com/v1"


def test_create_anthropic_chat_model_uses_custom_base_url() -> None:
    with (
        patch(
            "app.ai.shared.providers.settings.ANTHROPIC_API_KEY",
            "test-anthropic-key",
        ),
        patch(
            "app.ai.shared.providers.settings.ANTHROPIC_BASE_URL",
            "https://anthropic.example.com",
        ),
    ):
        model = create_anthropic_chat_model()

    assert model.anthropic_api_url == "https://anthropic.example.com"
