import { z } from "zod"
import type { UsersReadUsersData } from "@/client"

export type UserListQuery = NonNullable<UsersReadUsersData["query"]>
const sortColumns = [
  "full_name",
  "username",
  "email",
  "is_active",
  "is_superuser",
  "created_at",
] as const satisfies readonly NonNullable<UserListQuery["sort_by"]>[]

export const userTableSearchSchema = z.object({
  page: z.number().int().min(1).max(1_000_000).catch(1),
  pageSize: z
    .union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)])
    .catch(10),
  username: z.string().max(50).catch(""),
  email: z.string().max(255).catch(""),
  role: z.enum(["all", "superuser", "user"]).catch("all"),
  status: z.enum(["all", "active", "inactive"]).catch("all"),
  created: z.enum(["all", "today", "7d", "30d"]).catch("all"),
  sort: z.enum(sortColumns).catch("created_at"),
  order: z.enum(["asc", "desc"]).catch("desc"),
})

export type UserTableSearch = z.infer<typeof userTableSearchSchema>
export type UpdateUserTableSearch = (
  patch: Partial<UserTableSearch>,
  options?: { replace?: boolean },
) => void
export const defaultUserTableSearch = userTableSearchSchema.parse({})

export function userListQuery(
  search: UserTableSearch,
  today: string,
): UserListQuery {
  let createdAfter: string | undefined
  let createdBefore: string | undefined
  if (search.created !== "all") {
    // Calendar days in the browser's timezone; the API receives explicit UTC instants.
    const start = new Date(`${today}T00:00:00`)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    start.setDate(
      start.getDate() -
        (search.created === "7d" ? 6 : search.created === "30d" ? 29 : 0),
    )
    createdAfter = start.toISOString()
    createdBefore = end.toISOString()
  }
  return {
    skip: (search.page - 1) * search.pageSize,
    limit: search.pageSize,
    username: search.username.trim() || undefined,
    email: search.email.trim() || undefined,
    is_superuser:
      search.role === "all" ? undefined : search.role === "superuser",
    is_active: search.status === "all" ? undefined : search.status === "active",
    created_after: createdAfter,
    created_before: createdBefore,
    sort_by: search.sort,
    sort_order: search.order,
  }
}
