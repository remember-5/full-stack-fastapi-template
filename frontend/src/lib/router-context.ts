import type { QueryClient } from "@tanstack/react-query"
import type { AuthController } from "@/features/auth/auth-controller"

export type RouterContext = {
  queryClient: QueryClient
  auth: AuthController
}
