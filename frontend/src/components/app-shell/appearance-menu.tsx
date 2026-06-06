import { ChevronLeft, ChevronRight, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

type Theme = "light" | "dark" | "system"

const themes: Array<{
  value: Theme
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

function ThemeItems({ onSelect }: { onSelect: (theme: Theme) => void }) {
  return (
    <>
      {themes.map((theme) => (
        <DropdownMenuItem
          key={theme.value}
          data-testid={
            theme.value === "system" ? undefined : `${theme.value}-mode`
          }
          onClick={() => onSelect(theme.value)}
        >
          <theme.icon />
          {theme.label}
        </DropdownMenuItem>
      ))}
    </>
  )
}

export function SidebarAppearanceMenu() {
  const { setTheme, theme } = useTheme()
  const { isMobile } = useSidebar()
  const currentTheme = themes.find((item) => item.value === theme) ?? themes[2]
  const Icon = currentTheme.icon

  return (
    <SidebarMenuItem>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip="Appearance" data-testid="theme-button">
            <Icon />
            <span>Appearance</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          side={isMobile ? "top" : "right"}
        >
          <ThemeItems onSelect={setTheme} />
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function SidebarCollapseMenuItem() {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const Icon = isCollapsed ? ChevronRight : ChevronLeft
  const label = isCollapsed ? "Expand sidebar" : "Collapse sidebar"

  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={label} onClick={toggleSidebar}>
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppearanceMenu() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button data-testid="theme-button" variant="outline" size="icon">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThemeItems onSelect={setTheme} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
