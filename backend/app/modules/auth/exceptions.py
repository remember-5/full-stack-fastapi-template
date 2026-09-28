from fastapi import status

from app.core.exceptions import AppException
from app.modules.auth.constants import AuthErrorCode


class InvalidCredentials(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Incorrect email or password"
    code = AuthErrorCode.INVALID_CREDENTIALS


class InvalidToken(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    detail = "Could not validate credentials"
    code = AuthErrorCode.INVALID_TOKEN


class InvalidPasswordResetToken(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Invalid token"
    code = AuthErrorCode.INVALID_TOKEN


class AuthInactiveUser(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Inactive user"
    code = AuthErrorCode.INACTIVE_USER
