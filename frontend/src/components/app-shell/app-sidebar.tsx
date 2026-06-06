"use client"

import { Link as RouterLink } from "@tanstack/react-router"
import {
  SidebarAppearanceMenu,
  SidebarCollapseMenuItem,
} from "@/components/app-shell/appearance-menu"
import { NavMain } from "@/components/app-shell/nav-main"
import { getAppNavigation } from "@/components/app-shell/navigation"
import { UserMenu } from "@/components/app-shell/user-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"

function AppBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg">
          <RouterLink to="/">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">FastAPI Template</span>
              <span className="truncate text-xs">Application</span>
            </div>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const navItems = getAppNavigation(user)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarAppearanceMenu />
          <SidebarCollapseMenuItem />
        </SidebarMenu>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
