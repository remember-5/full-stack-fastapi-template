class AuthError(Exception):
    status_code = 400
    detail = "Auth error"

    def __init__(self, detail: str | None = None) -> None:
        if detail is not None:
            self.detail = detail
        super().__init__(self.detail)


class IncorrectEmailOrPassword(AuthError):
    status_code = 400
    detail = "Incorrect email or password"


class InactiveUser(AuthError):
    status_code = 400
    detail = "Inactive user"


class InvalidToken(AuthError):
    status_code = 400
    detail = "Invalid token"
