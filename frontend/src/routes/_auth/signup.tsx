import { createFileRoute, redirect } from "@tanstack/react-router"
import { SignUpPage } from "@/features/auth/signup-page"

export const Route = createFileRoute("/_auth/signup")({
  component: SignUpPage,
  beforeLoad: async ({ context }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: "/" })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Sign Up - FastAPI Template",
      },
    ],
  }),
})
