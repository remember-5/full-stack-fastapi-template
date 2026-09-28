import type { PaginationState } from "@tanstack/react-table"

export const usersQueryKeys = {
  all: ["users"] as const,
  lists: () => [...usersQueryKeys.all, "list"] as const,
  list: (pagination: PaginationState) =>
    [
      ...usersQueryKeys.lists(),
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      },
    ] as const,
}
