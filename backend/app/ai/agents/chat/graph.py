from __future__ import annotations

from typing import Any, Literal, cast

from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware
from langgraph.checkpoint.base import BaseCheckpointSaver

from app.ai.agents.chat.prompts import CHAT_AGENT_SYSTEM_PROMPT
from app.ai.agents.chat.tools import CHAT_AGENT_TOOLS
from app.ai.shared.providers import get_chat_model

SUMMARIZATION_TRIGGER: tuple[Literal["tokens"], int] = ("tokens", 4000)
SUMMARIZATION_KEEP: tuple[Literal["messages"], int] = ("messages", 12)


def create_graph(
    *,
    model: Any | None = None,
    checkpointer: BaseCheckpointSaver[Any] | None = None,
) -> Any:
    llm = model or get_chat_model()
    return create_agent(
        model=cast(Any, llm),
        tools=CHAT_AGENT_TOOLS,
        system_prompt=CHAT_AGENT_SYSTEM_PROMPT,
        middleware=[
            SummarizationMiddleware(
                model=cast(Any, llm),
                trigger=SUMMARIZATION_TRIGGER,
                keep=SUMMARIZATION_KEEP,
            )
        ],
        checkpointer=checkpointer,
        name="chat_agent",
    )


graph = create_graph()
