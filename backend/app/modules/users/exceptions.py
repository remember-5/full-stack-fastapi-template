class UsersError(Exception):
    status_code = 400
    detail = "User error"

    def __init__(self, detail: str | None = None) -> None:
        if detail is not None:
            self.detail = detail
        super().__init__(self.detail)


class UserAlreadyExists(UsersError):
    status_code = 400
    detail = "The user with this email already exists in the system"


class UserEmailConflict(UsersError):
    status_code = 409
    detail = "User with this email already exists"


class UserNotFound(UsersError):
    status_code = 404
    detail = "User not found"


class UserForbidden(UsersError):
    status_code = 403
    detail = "The user doesn't have enough privileges"


class CannotDeleteSuperuserSelf(UsersError):
    status_code = 403
    detail = "Super users are not allowed to delete themselves"


class IncorrectPassword(UsersError):
    status_code = 400
    detail = "Incorrect password"


class NewPasswordSameAsCurrent(UsersError):
    status_code = 400
    detail = "New password cannot be the same as the current one"
