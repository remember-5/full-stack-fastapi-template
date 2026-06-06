import { createFileRoute, redirect } from "@tanstack/react-router"
import { currentUserQueryOptions } from "@/features/auth/auth-controller"
import { UsersPage } from "@/features/users/users-page"

export const Route = createFileRoute("/_authenticated/admin")({
  component: UsersPage,
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
        title: "Users - FastAPI Template",
      },
    ],
  }),
})
