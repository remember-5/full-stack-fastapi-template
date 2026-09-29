import type { UserListQuery } from "./user-table-state"

export const usersQueryKeys = {
  all: ["users"] as const,
  lists: () => [...usersQueryKeys.all, "list"] as const,
  list: (query: UserListQuery) => [...usersQueryKeys.lists(), query] as const,
}
