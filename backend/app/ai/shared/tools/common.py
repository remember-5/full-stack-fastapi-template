from __future__ import annotations

import ast
from datetime import UTC, datetime, tzinfo
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from langchain_core.tools import tool


def _eval_ast(node: ast.AST) -> int | float:
    if isinstance(node, ast.Expression):
        return _eval_ast(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, int | float):
        return node.value
    if isinstance(node, ast.BinOp):
        left = _eval_ast(node.left)
        right = _eval_ast(node.right)
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        if isinstance(node.op, ast.Div):
            return left / right
        if isinstance(node.op, ast.FloorDiv):
            return left // right
        if isinstance(node.op, ast.Mod):
            return left % right
        if isinstance(node.op, ast.Pow):
            return left**right
    if isinstance(node, ast.UnaryOp):
        operand = _eval_ast(node.operand)
        if isinstance(node.op, ast.UAdd):
            return +operand
        if isinstance(node.op, ast.USub):
            return -operand
    raise ValueError("Unsupported expression")


@tool
def get_current_time(timezone_name: str = "UTC") -> str:
    """Return the current timestamp for the requested IANA timezone."""
    timezone: tzinfo
    try:
        timezone = ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        timezone = UTC
    return datetime.now(timezone).isoformat()


@tool
def calculate(expression: str) -> str:
    """Evaluate a simple arithmetic expression."""
    parsed = ast.parse(expression, mode="eval")
    result = _eval_ast(parsed)
    return str(result)


@tool
def list_public_tools() -> list[str]:
    """List shared tools available to agent graphs."""
    return ["get_current_time", "calculate", "list_public_tools"]


COMMON_TOOLS = (get_current_time, calculate, list_public_tools)
