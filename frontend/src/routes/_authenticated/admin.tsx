import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from "@tanstack/react-router"
import { useCallback } from "react"
import { currentUserQueryOptions } from "@/features/auth/auth-controller"
import {
  defaultUserTableSearch,
  type UpdateUserTableSearch,
  type UserTableSearch,
  userTableSearchSchema,
} from "@/features/users/user-table-state"
import { UsersPage } from "@/features/users/users-page"

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminRoute,
  validateSearch: (search: Record<string, unknown>): UserTableSearch =>
    userTableSearchSchema.parse(search),
  search: {
    middlewares: [stripSearchParams<UserTableSearch>(defaultUserTableSearch)],
  },
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      currentUserQueryOptions(),
    )
    if (!user.is_superuser) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "用户 - FastAPI Template",
      },
    ],
  }),
})

function AdminRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const onSearchChange = useCallback<UpdateUserTableSearch>(
    (patch, options) => {
      void navigate({
        search: (previous) => ({ ...previous, ...patch }),
        replace: options?.replace,
        resetScroll: false,
      })
    },
    [navigate],
  )
  return <UsersPage search={search} onSearchChange={onSearchChange} />
}
