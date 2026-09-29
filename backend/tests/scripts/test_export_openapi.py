import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from app.commands import export_openapi


def test_check_accepts_different_json_formatting_without_writing(
    tmp_path: Path,
) -> None:
    output = tmp_path / "openapi.json"
    original = '{"paths":{}, "openapi":"3.1.0"}'
    output.write_text(original)

    assert export_openapi.check_schema({"openapi": "3.1.0", "paths": {}}, output) == 0
    assert output.read_text() == original


@pytest.mark.parametrize("content", [None, "not json", '{"paths": {}}'])
def test_check_rejects_missing_invalid_or_stale_snapshot(
    tmp_path: Path, content: str | None
) -> None:
    output = tmp_path / "openapi.json"
    if content is not None:
        output.write_text(content)

    assert export_openapi.check_schema({"openapi": "3.1.0"}, output) == 1
    assert (output.read_text() if output.exists() else None) == content


def test_write_is_deterministic_and_preserves_permissions(tmp_path: Path) -> None:
    output = tmp_path / "openapi.json"
    output.write_text("old snapshot")
    output.chmod(0o640)

    export_openapi.write_schema({"paths": {}, "openapi": "3.1.0"}, output)
    first = output.read_bytes()
    export_openapi.write_schema({"paths": {}, "openapi": "3.1.0"}, output)

    assert output.read_bytes() == first
    assert json.loads(first) == {"openapi": "3.1.0", "paths": {}}
    assert output.stat().st_mode & 0o777 == 0o640
    assert list(tmp_path.iterdir()) == [output]


def test_check_distinguishes_boolean_and_number_values(tmp_path: Path) -> None:
    output = tmp_path / "openapi.json"
    output.write_text('{"example": true}')

    assert export_openapi.check_schema({"example": 1}, output) == 1


def test_failed_replacement_keeps_original_and_cleans_temporary_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    output = tmp_path / "openapi.json"
    output.write_text("original")

    def fail_replace(*_args: object) -> None:
        raise OSError("replacement failed")

    monkeypatch.setattr(Path, "replace", fail_replace)
    with pytest.raises(OSError, match="replacement failed"):
        export_openapi.write_schema({"paths": {}}, output)

    assert output.read_text() == "original"
    assert list(tmp_path.iterdir()) == [output]


def test_command_loads_dotenv_fallback_and_respects_environment(tmp_path: Path) -> None:
    example = tmp_path / ".env.example"
    shutil.copyfile(export_openapi.PROJECT_ROOT / ".env.example", example)
    environment = os.environ.copy()
    environment.pop("APP_ENV_FILE", None)
    environment.pop("PROJECT_NAME", None)
    environment["POSTGRES_SERVER"] = "unreachable.invalid"
    output = tmp_path / "snapshot.json"
    command = [
        sys.executable,
        "-c",
        "import sys; from pathlib import Path; "
        "from app.commands import export_openapi as command; "
        "command.PROJECT_ROOT = Path(sys.argv.pop(1)); "
        "sys.exit(command.main())",
        str(tmp_path),
        "--write",
        "--output",
        str(output),
    ]

    def run_export() -> dict[str, object]:
        result = subprocess.run(
            command,
            cwd=tmp_path,
            env=environment,
            capture_output=True,
            text=True,
            timeout=30,
        )
        assert result.returncode == 0, result.stderr
        return json.loads(output.read_text())["info"]

    assert run_export()["title"]
    (tmp_path / ".env").write_text(
        example.read_text() + '\nPROJECT_NAME="Dotenv project"\n'
    )
    assert run_export()["title"] == "Dotenv project"
    environment["PROJECT_NAME"] = "Environment project"
    assert run_export()["title"] == "Environment project"

    environment["APP_ENV_FILE"] = str(tmp_path / "custom.env")
    environment.pop("PROJECT_NAME")
    (tmp_path / "custom.env").write_text(
        example.read_text() + '\nPROJECT_NAME="Custom project"\n'
    )
    assert run_export()["title"] == "Custom project"

    check_command = ["--check" if arg == "--write" else arg for arg in command]
    result = subprocess.run(
        check_command, cwd=tmp_path, env=environment, capture_output=True, timeout=30
    )
    assert result.returncode == 0
    output.write_text("{}")
    result = subprocess.run(
        check_command, cwd=tmp_path, env=environment, capture_output=True, timeout=30
    )
    assert result.returncode == 1
    assert output.read_text() == "{}"

    environment["POSTGRES_PORT"] = "sensitive-invalid-value"
    result = subprocess.run(
        command,
        cwd=tmp_path,
        env=environment,
        capture_output=True,
        text=True,
        timeout=30,
    )
    assert result.returncode == 1
    assert "POSTGRES_PORT" in result.stderr
    assert "sensitive-invalid-value" not in result.stdout + result.stderr
    assert output.read_text() == "{}"
