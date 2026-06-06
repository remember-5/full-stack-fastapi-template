import { createFileRoute, redirect } from "@tanstack/react-router"
import { RecoverPasswordPage } from "@/features/auth/recover-password-page"

export const Route = createFileRoute("/_auth/recover-password")({
  component: RecoverPasswordPage,
  beforeLoad: async ({ context }) => {
    if (context.auth.isAuthenticated()) {
      throw redirect({ to: "/" })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Recover Password - FastAPI Template",
      },
    ],
  }),
})
