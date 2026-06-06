import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-shell/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  currentUserQueryKey,
  currentUserQueryOptions,
} from "@/features/auth/auth-controller"
import { isUnauthorizedApiError } from "@/lib/api-error"

export const Route = createFileRoute("/_authenticated")({
  component: Layout,
  beforeLoad: async ({ context, location }) => {
    const redirectToLogin = () => {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      })
    }

    if (!context.auth.isAuthenticated()) {
      redirectToLogin()
    }

    try {
      await context.queryClient.ensureQueryData(currentUserQueryOptions())
    } catch (error) {
      if (isUnauthorizedApiError(error)) {
        context.auth.clearToken()
        context.queryClient.removeQueries({ queryKey: currentUserQueryKey })
        redirectToLogin()
      }
      throw error
    }
  },
})

function Layout() {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-12 shrink-0 items-center border-b px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
