import { queryOptions } from "@tanstack/react-query"
import { usersReadUserMe } from "@/client"
import { unwrapData } from "@/lib/api-client"

const ACCESS_TOKEN_KEY = "access_token"

export type AuthController = {
  getToken: () => string | null
  setToken: (token: string) => void
  clearToken: () => void
  isAuthenticated: () => boolean
}

export type AuthRedirectPath = "/" | "/admin"

export const authQueryKeys = {
  currentUser: ["currentUser"] as const,
}

export const currentUserQueryKey = authQueryKeys.currentUser

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: currentUserQueryKey,
    queryFn: async () => unwrapData(await usersReadUserMe()),
  })
}

export const authController: AuthController = {
  getToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(ACCESS_TOKEN_KEY),
  isAuthenticated: () => localStorage.getItem(ACCESS_TOKEN_KEY) !== null,
}

export function getSafeRedirectPath(
  redirect: string | undefined,
): AuthRedirectPath {
  if (
    !redirect?.startsWith("/") ||
    redirect.startsWith("//") ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(redirect)
  ) {
    return "/"
  }

  const path = redirect.split(/[?#]/, 1)[0]
  if (path === "/admin") return "/admin"
  return "/"
}
