"""Export or check the frontend's OpenAPI snapshot without starting a server."""

import argparse
import difflib
import json
import os
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from pydantic import ValidationError

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = PROJECT_ROOT / "frontend" / "openapi.json"


def generate_schema() -> dict[str, Any]:
    env_file = PROJECT_ROOT / ".env"
    if not env_file.is_file():
        env_file = PROJECT_ROOT / ".env.example"
    os.environ.setdefault("APP_ENV_FILE", str(env_file))

    # Select the settings file before importing the application's settings singleton.
    from app.main import app

    return app.openapi()


def format_schema(schema: object) -> str:
    return json.dumps(schema, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def check_schema(schema: dict[str, Any], output: Path) -> int:
    try:
        stored = json.loads(output.read_text(encoding="utf-8"))
    except OSError, ValueError:
        sys.stderr.write(
            f"Cannot read a valid OpenAPI snapshot at {output}. Run make client.\n"
        )
        return 1

    stored_content = format_schema(stored)
    current_content = format_schema(schema)
    if stored_content == current_content:
        sys.stdout.write("OpenAPI snapshot is up to date.\n")
        return 0

    sys.stderr.writelines(
        difflib.unified_diff(
            stored_content.splitlines(keepends=True),
            current_content.splitlines(keepends=True),
            fromfile=str(output),
            tofile="current backend OpenAPI",
        )
    )
    sys.stderr.write("OpenAPI snapshot is out of date. Run make client.\n")
    return 1


def write_schema(schema: dict[str, Any], output: Path) -> None:
    # Preserve the existing snapshot format and API order used by client generation.
    content = json.dumps(schema) + "\n"
    temporary: Path | None = None
    try:
        with NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=output.parent,
            prefix=".openapi-",
            delete=False,
        ) as stream:
            temporary = Path(stream.name)
            stream.write(content)
        temporary.chmod(output.stat().st_mode & 0o777 if output.exists() else 0o644)
        temporary.replace(output)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    sys.stdout.write(f"Updated {output}.\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--check", action="store_true", help="Check without changing files"
    )
    mode.add_argument(
        "--write", action="store_true", help="Atomically update the snapshot"
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    try:
        schema = generate_schema()
        if args.check:
            return check_schema(schema, args.output)
        write_schema(schema, args.output)
    except ValidationError as exc:
        fields = ", ".join(".".join(map(str, error["loc"])) for error in exc.errors())
        sys.stderr.write(
            f"Invalid backend settings ({fields}); check your environment.\n"
        )
        return 1
    except OSError as exc:
        sys.stderr.write(f"OpenAPI export failed: {exc}\n")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
