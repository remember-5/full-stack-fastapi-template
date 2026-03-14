from app.common.exceptions import DomainError


class UserNotFoundError(DomainError):
    status_code = 404

    def __init__(self) -> None:
        super().__init__("User not found")


class UserAlreadyExistsError(DomainError):
    status_code = 400

    def __init__(
        self, detail: str = "The user with this email already exists in the system."
    ) -> None:
        super().__init__(detail)


class EmailAlreadyExistsError(DomainError):
    status_code = 409

    def __init__(self) -> None:
        super().__init__("User with this email already exists")


class IncorrectPasswordError(DomainError):
    status_code = 400

    def __init__(self) -> None:
        super().__init__("Incorrect password")


class SamePasswordError(DomainError):
    status_code = 400

    def __init__(self) -> None:
        super().__init__("New password cannot be the same as the current one")


class InactiveUserError(DomainError):
    status_code = 400

    def __init__(self) -> None:
        super().__init__("Inactive user")


class IncorrectCredentialsError(DomainError):
    status_code = 400

    def __init__(self) -> None:
        super().__init__("Incorrect email or password")


class SuperuserCannotDeleteSelfError(DomainError):
    status_code = 403

    def __init__(self) -> None:
        super().__init__("Super users are not allowed to delete themselves")


class InsufficientPrivilegesError(DomainError):
    status_code = 403

    def __init__(self) -> None:
        super().__init__("The user doesn't have enough privileges")
