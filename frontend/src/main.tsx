import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/sonner"
import { TooltipProvider } from "./components/ui/tooltip"
import {
  authController,
  currentUserQueryKey,
} from "./features/auth/auth-controller"
import "./index.css"
import { configureApiClient } from "./lib/api-client"
import { isUnauthorizedApiError } from "./lib/api-error"
import { routeTree } from "./routeTree.gen"

configureApiClient(import.meta.env.VITE_API_URL, authController.getToken)

const handleApiError = (error: Error) => {
  if (isUnauthorizedApiError(error)) {
    authController.clearToken()
    queryClient.removeQueries({ queryKey: currentUserQueryKey })
    router.navigate({
      to: "/login",
      search: {
        redirect: router.state.location.href,
      },
    })
  }
}
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: authController,
  },
})
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider delayDuration={0}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster richColors closeButton />
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
