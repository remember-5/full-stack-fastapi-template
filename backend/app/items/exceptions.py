from app.common.exceptions import DomainError


class ItemNotFoundError(DomainError):
    status_code = 404

    def __init__(self) -> None:
        super().__init__("Item not found")


class ItemPermissionError(DomainError):
    status_code = 403

    def __init__(self) -> None:
        super().__init__("Not enough permissions")
