from langchain_core.messages import AIMessage
from langgraph.checkpoint.memory import InMemorySaver

from app.ai.agents.chat.graph import (
    SUMMARIZATION_KEEP,
    SUMMARIZATION_TRIGGER,
    create_graph,
)
from app.ai.agents.chat.prompts import CHAT_AGENT_SYSTEM_PROMPT


class FakeChatModel:
    def __init__(self, response_text: str) -> None:
        self.response_text = response_text
        self.last_messages: object = None
        self._llm_type = "openai-chat"

    def bind(self, **_kwargs: object) -> "FakeChatModel":
        return self

    def bind_tools(self, *_args: object, **_kwargs: object) -> "FakeChatModel":
        return self

    def invoke(self, messages: object) -> AIMessage:
        self.last_messages = messages
        return AIMessage(content=self.response_text)


def test_chat_graph_supports_standard_chat_messages() -> None:
    fake_model = FakeChatModel("hello from chat agent")
    result = create_graph(model=fake_model).invoke(
        {"messages": [{"role": "user", "content": "hello langgraph"}]}
    )

    assert len(result["messages"]) == 2
    assert result["messages"][-1].content == "hello from chat agent"
    assert fake_model.last_messages[0].content == CHAT_AGENT_SYSTEM_PROMPT


def test_chat_graph_uses_expected_summarization_constants() -> None:
    assert SUMMARIZATION_TRIGGER == ("tokens", 4000)
    assert SUMMARIZATION_KEEP == ("messages", 12)


def test_chat_graph_accepts_explicit_checkpointer() -> None:
    fake_model = FakeChatModel("hello from chat agent")
    sentinel = InMemorySaver()

    graph = create_graph(model=fake_model, checkpointer=sentinel)

    assert graph.checkpointer is sentinel
