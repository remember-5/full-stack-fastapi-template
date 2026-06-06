from unittest.mock import MagicMock, patch

from app.core import email


def test_send_email_uses_configured_smtp_options() -> None:
    message = MagicMock()

    with (
        patch.object(email.settings, "SMTP_HOST", "smtp.example.com"),
        patch.object(email.settings, "SMTP_PORT", 2525),
        patch.object(email.settings, "SMTP_TLS", True),
        patch.object(email.settings, "SMTP_SSL", False),
        patch.object(email.settings, "SMTP_USER", "user"),
        patch.object(email.settings, "SMTP_PASSWORD", "password"),
        patch.object(email.settings, "EMAILS_FROM_NAME", "Example"),
        patch.object(email.settings, "EMAILS_FROM_EMAIL", "noreply@example.com"),
        patch("app.core.email.Message", return_value=message) as message_cls,
    ):
        email.send_email(
            email_to="person@example.com",
            subject="Welcome",
            html_content="<p>Hello</p>",
        )

    message_cls.assert_called_once_with(
        subject="Welcome",
        html="<p>Hello</p>",
        mail_from=("Example", "noreply@example.com"),
    )
    message.send.assert_called_once_with(
        to="person@example.com",
        smtp={
            "host": "smtp.example.com",
            "port": 2525,
            "tls": True,
            "user": "user",
            "password": "password",
        },
    )
