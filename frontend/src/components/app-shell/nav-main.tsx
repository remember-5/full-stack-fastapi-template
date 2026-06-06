"use client"

import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import type { AppNavItem } from "@/components/app-shell/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({ items }: { items: AppNavItem[] }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const router = useRouterState()

  const closeMobileMenu = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            router.location.pathname === item.path ||
            item.items?.some(
              (subItem) => subItem.path === router.location.pathname,
            )

          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.title}
              >
                <RouterLink to={item.path} onClick={closeMobileMenu}>
                  <item.icon />
                  <span>{item.title}</span>
                </RouterLink>
              </SidebarMenuButton>
              {item.items?.length ? (
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.path}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={router.location.pathname === subItem.path}
                      >
                        <RouterLink to={subItem.path} onClick={closeMobileMenu}>
                          {subItem.icon ? <subItem.icon /> : null}
                          <span>{subItem.title}</span>
                        </RouterLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
