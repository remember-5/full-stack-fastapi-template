import { ChevronsUpDown, LogOut, Settings } from "lucide-react"
import { lazy, Suspense, useState } from "react"
import type { UserPublic } from "@/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/lib/user"

const AccountSettingsDialog = lazy(() =>
  import("@/features/settings/account-settings-dialog").then((module) => ({
    default: module.AccountSettingsDialog,
  })),
)

function UserIdentity({ user }: { user: UserPublic }) {
  const displayName = user.full_name || user.email

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="size-8 rounded-lg">
        <AvatarFallback className="rounded-lg">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
    </div>
  )
}

export function UserMenu({ user }: { user?: UserPublic | null }) {
  const { logout } = useAuth()
  const { isMobile } = useSidebar()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [accountSettingsMounted, setAccountSettingsMounted] = useState(false)

  if (!user) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-testid="user-menu"
            >
              <UserIdentity user={user} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="px-1 py-1.5">
                <UserIdentity user={user} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setMenuOpen(false)
                setAccountSettingsMounted(true)
                setAccountSettingsOpen(true)
              }}
            >
              <Settings />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {accountSettingsMounted ? (
          <Suspense fallback={null}>
            <AccountSettingsDialog
              open={accountSettingsOpen}
              onOpenChange={setAccountSettingsOpen}
            />
          </Suspense>
        ) : null}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
