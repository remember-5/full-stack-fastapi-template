import { createFileRoute, redirect } from "@tanstack/react-router"
import { ResetPasswordPage } from "@/features/auth/reset-password-page"

type ResetPasswordSearch = {
  token: string
}

function validateResetPasswordSearch(
  search: Record<string, unknown>,
): ResetPasswordSearch {
  return {
    token: typeof search.token === "string" ? search.token : "",
  }
}

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPasswordRoute,
  validateSearch: validateResetPasswordSearch,
  beforeLoad: async ({ context, search }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: "/" })
    }
    if (!search.token) {
      throw redirect({ to: "/login" })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Reset Password - FastAPI Template",
      },
    ],
  }),
})

function ResetPasswordRoute() {
  const { token } = Route.useSearch()
  return <ResetPasswordPage token={token} />
}
