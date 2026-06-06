import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  type AuthRedirectPath,
  getSafeRedirectPath,
} from "@/features/auth/auth-controller"
import { LoginPage } from "@/features/auth/login-page"

type LoginSearch = {
  redirect?: string
}

function validateLoginSearch(search: Record<string, unknown>): LoginSearch {
  return {
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }
}

export const Route = createFileRoute("/_auth/login")({
  component: LoginRoute,
  validateSearch: validateLoginSearch,
  beforeLoad: async ({ context, search }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({
        to: getSafeRedirectPath(search.redirect),
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Log In - FastAPI Template",
      },
    ],
  }),
})

function LoginRoute() {
  const { redirect } = Route.useSearch()
  const redirectTo: AuthRedirectPath = getSafeRedirectPath(redirect)
  return <LoginPage redirectTo={redirectTo} />
}
