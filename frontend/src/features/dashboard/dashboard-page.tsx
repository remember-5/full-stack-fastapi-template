import { CalendarClock, ShieldCheck, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

export function DashboardPage() {
  const { user } = useAuth()
  const displayName = user?.full_name || user?.email || "用户"
  const lastUpdated = user?.updated_at
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(user.updated_at))
    : "暂无数据"

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">账号</CardTitle>
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
            <CardTitle className="text-sm font-medium">权限</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={user?.is_superuser ? "default" : "secondary"}>
              {user?.is_superuser ? "超级用户" : "普通用户"}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              {user?.is_active ? "账号已启用" : "账号已停用"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">资料</CardTitle>
            <CalendarClock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">已更新</div>
            <p className="mt-1 text-sm text-muted-foreground">{lastUpdated}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
