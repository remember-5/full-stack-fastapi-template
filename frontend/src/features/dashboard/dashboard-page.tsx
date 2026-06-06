import { CalendarClock, ShieldCheck, UserRound } from "lucide-react"
import { PageHeader } from "@/components/app-shell/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

export function DashboardPage() {
  const { user } = useAuth()
  const displayName = user?.full_name || user?.email || "User"
  const lastUpdated = user?.updated_at
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(user.updated_at))
    : "Unavailable"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${displayName}.`}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Account</CardTitle>
            <UserRound className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-2xl font-semibold">{displayName}</div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Access</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={user?.is_superuser ? "default" : "secondary"}>
              {user?.is_superuser ? "Superuser" : "User"}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              {user?.is_active ? "Active account" : "Inactive account"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">Updated</div>
            <p className="mt-1 text-sm text-muted-foreground">{lastUpdated}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            This dashboard uses existing account data only. Add generated
            resources later to expand operational views without changing the app
            shell.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            Use the sidebar to manage users and account settings.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
