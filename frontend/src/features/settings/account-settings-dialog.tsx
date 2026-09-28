"use client"

import { KeyRound, ShieldAlert, UserRound } from "lucide-react"
import type { ComponentType, CSSProperties, ReactNode } from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import ChangePassword from "@/features/settings/change-password"
import DeleteAccount from "@/features/settings/delete-account"
import UserInformation from "@/features/settings/user-information"

type SettingsSection = "my-profile" | "password" | "danger-zone"

const settingsSections: Array<{
  value: SettingsSection
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  component: ComponentType
}> = [
  {
    value: "my-profile",
    title: "我的资料",
    description: "管理你的个人资料。",
    icon: UserRound,
    component: UserInformation,
  },
  {
    value: "password",
    title: "密码",
    description: "更新你的账号密码。",
    icon: KeyRound,
    component: ChangePassword,
  },
  {
    value: "danger-zone",
    title: "危险操作",
    description: "管理不可逆的账号操作。",
    icon: ShieldAlert,
    component: DeleteAccount,
  },
]

function AccountSettingsDialogContent({
  activeSection,
  setActiveSection,
}: {
  activeSection: SettingsSection
  setActiveSection: (section: SettingsSection) => void
}) {
  const currentSection =
    settingsSections.find((section) => section.value === activeSection) ??
    settingsSections[0]
  const CurrentSection = currentSection.component

  return (
    <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
      <DialogTitle className="sr-only">账号设置</DialogTitle>
      <DialogDescription className="sr-only">
        管理你的账号设置。
      </DialogDescription>
      <SidebarProvider
        className="items-start"
        style={
          {
            "--sidebar-width": "12rem",
          } as CSSProperties
        }
      >
        <Sidebar collapsible="none" className="hidden md:flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsSections.map((section) => (
                    <SidebarMenuItem key={section.value}>
                      <SidebarMenuButton
                        isActive={section.value === activeSection}
                        onClick={() => setActiveSection(section.value)}
                      >
                        <section.icon />
                        <span>{section.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
          <div className="border-b p-3 md:hidden">
            <Select value={activeSection} onValueChange={setActiveSection}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settingsSections.map((section) => (
                  <SelectItem key={section.value} value={section.value}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <CurrentSection />
          </div>
        </main>
      </SidebarProvider>
    </DialogContent>
  )
}

export function AccountSettingsDialog({
  children,
  defaultSection = "my-profile",
  open: openProp,
  onOpenChange,
}: {
  children?: ReactNode
  defaultSection?: SettingsSection
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeSection, setActiveSection] =
    useState<SettingsSection>(defaultSection)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <AccountSettingsDialogContent
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
    </Dialog>
  )
}
