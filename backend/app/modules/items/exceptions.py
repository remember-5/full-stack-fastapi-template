class ItemsError(Exception):
    status_code = 400
    detail = "Item error"

    def __init__(self, detail: str | None = None) -> None:
        if detail is not None:
            self.detail = detail
        super().__init__(self.detail)


class ItemNotFound(ItemsError):
    status_code = 404
    detail = "Item not found"


class ItemForbidden(ItemsError):
    status_code = 403
    detail = "Not enough permissions"
