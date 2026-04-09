from __future__ import annotations

from typing import Literal

from langchain.chat_models import init_chat_model
from langchain_core.language_models.chat_models import BaseChatModel

from app.core.config import settings

LLMProvider = Literal["openai", "anthropic"]
ChatModel = BaseChatModel


def _require_api_key(value: str | None, *, env_var: str) -> str:
    if value:
        return value
    raise ValueError(f"{env_var} is required to initialize the configured chat model")


def get_default_model_name(provider: LLMProvider | None = None) -> str:
    resolved_provider = provider or settings.LLM_PROVIDER_DEFAULT
    if resolved_provider == "openai":
        return settings.LLM_MODEL_OPENAI_DEFAULT
    return settings.LLM_MODEL_ANTHROPIC_DEFAULT


def create_openai_chat_model(
    *, model: str | None = None, temperature: float = 0
) -> ChatModel:
    api_key = _require_api_key(settings.OPENAI_API_KEY, env_var="OPENAI_API_KEY")
    return init_chat_model(
        f"openai:{model or settings.LLM_MODEL_OPENAI_DEFAULT}",
        temperature=temperature,
        api_key=api_key,
        base_url=settings.OPENAI_BASE_URL,
    )


def create_anthropic_chat_model(
    *, model: str | None = None, temperature: float = 0
) -> ChatModel:
    api_key = _require_api_key(
        settings.ANTHROPIC_API_KEY,
        env_var="ANTHROPIC_API_KEY",
    )
    return init_chat_model(
        f"anthropic:{model or settings.LLM_MODEL_ANTHROPIC_DEFAULT}",
        temperature=temperature,
        api_key=api_key,
        base_url=settings.ANTHROPIC_BASE_URL,
    )


def get_chat_model(
    *,
    provider: LLMProvider | None = None,
    model: str | None = None,
    temperature: float = 0,
) -> ChatModel:
    resolved_provider = provider or settings.LLM_PROVIDER_DEFAULT
    if resolved_provider == "openai":
        return create_openai_chat_model(model=model, temperature=temperature)
    return create_anthropic_chat_model(model=model, temperature=temperature)


def create_default_chat_model(
    *,
    provider: LLMProvider | None = None,
    model: str | None = None,
    temperature: float = 0,
) -> ChatModel:
    return get_chat_model(provider=provider, model=model, temperature=temperature)
