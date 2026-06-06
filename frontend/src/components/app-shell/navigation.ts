import { Home, Users } from "lucide-react"
import type { UserPublic } from "@/client"

export type AppNavItem = {
  title: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  requiresSuperuser?: boolean
  items?: Array<{
    title: string
    path: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

const appNavItems: AppNavItem[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    title: "Users",
    path: "/admin",
    icon: Users,
    requiresSuperuser: true,
  },
]

export function getAppNavigation(user?: UserPublic | null): AppNavItem[] {
  return appNavItems.filter(
    (item) => !item.requiresSuperuser || user?.is_superuser,
  )
}
