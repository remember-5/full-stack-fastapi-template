from fastapi import status

from app.core.exceptions import AppException
from app.modules.users.constants import UserErrorCode


class UserNotFound(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "User not found"
    code = UserErrorCode.NOT_FOUND


class UserEmailAlreadyExists(AppException):
    status_code = status.HTTP_409_CONFLICT
    detail = "User with this email already exists"
    code = UserErrorCode.EMAIL_EXISTS


class UserInactive(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Inactive user"
    code = UserErrorCode.INACTIVE


class UserForbidden(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "The user doesn't have enough privileges"
    code = UserErrorCode.FORBIDDEN


class IncorrectPassword(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Incorrect password"
    code = UserErrorCode.INCORRECT_PASSWORD


class SamePassword(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "New password cannot be the same as the current one"
    code = UserErrorCode.SAME_PASSWORD
