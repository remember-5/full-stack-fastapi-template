class DomainError(Exception):
    """Base class for all domain exceptions.

    Subclasses set ``status_code`` so the global handler in ``main.py``
    can convert any ``DomainError`` to the correct HTTP response
    without maintaining a separate mapping table.
    """

    status_code: int = 500

    def __init__(self, detail: str = "Internal server error") -> None:
        self.detail = detail
        super().__init__(detail)


class InvalidResetTokenError(DomainError):
    status_code = 400

    def __init__(self) -> None:
        super().__init__("Invalid token")


class CredentialsValidationError(DomainError):
    status_code = 403

    def __init__(self) -> None:
        super().__init__("Could not validate credentials")
