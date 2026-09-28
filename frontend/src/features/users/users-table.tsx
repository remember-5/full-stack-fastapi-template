import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from "@tanstack/react-table"
import { ChevronDown, EllipsisVertical, Search, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { UserPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ResourceDataTable } from "@/features/resources/resource-data-table"
import {
  ChangeUserPasswordDialog,
  DeleteUserDialog,
  EditUserDialog,
} from "@/features/users/user-dialogs"
import { cn } from "@/lib/utils"

export type UserTableData = UserPublic & {
  isCurrentUser: boolean
}

type UserRoleFilter = "all" | "superuser" | "user"
type UserStatusFilter = "all" | "active" | "inactive"
type UserCreatedAtFilter = "all" | "today" | "7d" | "30d"

const roleFilterLabels: Record<UserRoleFilter, string> = {
  all: "角色",
  superuser: "超级用户",
  user: "普通用户",
}

const statusFilterLabels: Record<UserStatusFilter, string> = {
  all: "状态",
  active: "启用",
  inactive: "停用",
}

const createdAtFilterLabels: Record<UserCreatedAtFilter, string> = {
  all: "创建时间",
  today: "今天",
  "7d": "最近 7 天",
  "30d": "最近 30 天",
}

const userDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
})

function isWithinCreatedAtFilter(
  createdAt: string,
  filter: UserCreatedAtFilter,
) {
  if (filter === "all") {
    return true
  }

  const createdDate = new Date(createdAt)
  if (Number.isNaN(createdDate.getTime())) {
    return false
  }

  const now = new Date()
  if (filter === "today") {
    return createdDate.toDateString() === now.toDateString()
  }

  const days = filter === "7d" ? 7 : 30
  const threshold = new Date(now)
  threshold.setDate(now.getDate() - days)
  return createdDate >= threshold
}

function UserFilterMenu<TValue extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string
  value: TValue
  options: Array<{ value: TValue; label: string }>
  onValueChange: (value: TValue) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-[34px] rounded-md bg-card px-2.5 text-[13px]"
        >
          {label}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as TValue)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserActions({ user }: { user: UserTableData }) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <EllipsisVertical />
          <span className="sr-only">打开用户操作</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditUserDialog user={user} onSuccess={() => setOpen(false)} />
        <ChangeUserPasswordDialog
          user={user}
          onSuccess={() => setOpen(false)}
        />
        {user.isCurrentUser ? null : (
          <DeleteUserDialog userId={user.id} onSuccess={() => setOpen(false)} />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const columns: ColumnDef<UserTableData>[] = [
  {
    accessorKey: "full_name",
    header: "姓名",
    cell: ({ row }) => {
      const fullName = row.original.full_name
      return (
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "truncate font-medium",
              !fullName && "text-muted-foreground",
            )}
          >
            {fullName || "暂无"}
          </span>
          {row.original.isCurrentUser ? (
            <Badge variant="outline">你</Badge>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: "username",
    header: "用户名",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.username}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "邮箱",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "is_superuser",
    header: "角色",
    cell: ({ row }) => (
      <Badge variant={row.original.is_superuser ? "default" : "secondary"}>
        {row.original.is_superuser ? "超级用户" : "普通用户"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_active",
    header: "状态",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            row.original.is_active ? "bg-emerald-500" : "bg-muted-foreground",
          )}
        />
        <span className={row.original.is_active ? "" : "text-muted-foreground"}>
          {row.original.is_active ? "启用" : "停用"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "创建时间",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {userDateFormatter.format(new Date(row.original.created_at))}
      </span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    header: () => <span className="sr-only">操作</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <UserActions user={row.original} />
      </div>
    ),
  },
]

export function UsersTable({
  data,
  loading,
  error,
  pagination,
  onPaginationChange,
  pageCount,
  totalCount,
  action,
}: {
  data: UserTableData[]
  loading?: boolean
  error?: React.ReactNode
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageCount?: number
  totalCount?: number
  action?: React.ReactNode
}) {
  const [usernameSearch, setUsernameSearch] = useState("")
  const [emailSearch, setEmailSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all")
  const [createdAtFilter, setCreatedAtFilter] =
    useState<UserCreatedAtFilter>("all")
  const hasFilters =
    usernameSearch.trim().length > 0 ||
    emailSearch.trim().length > 0 ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    createdAtFilter !== "all"
  const filteredData = useMemo(() => {
    const normalizedUsernameSearch = usernameSearch.trim().toLowerCase()
    const normalizedEmailSearch = emailSearch.trim().toLowerCase()

    return data.filter((user) => {
      const matchesUsername =
        !normalizedUsernameSearch ||
        user.username.toLowerCase().includes(normalizedUsernameSearch)
      const matchesEmail =
        !normalizedEmailSearch ||
        user.email.toLowerCase().includes(normalizedEmailSearch)
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "superuser" && user.is_superuser) ||
        (roleFilter === "user" && !user.is_superuser)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active)
      const matchesCreatedAt = isWithinCreatedAtFilter(
        user.created_at,
        createdAtFilter,
      )

      return (
        matchesUsername &&
        matchesEmail &&
        matchesRole &&
        matchesStatus &&
        matchesCreatedAt
      )
    })
  }, [
    createdAtFilter,
    data,
    emailSearch,
    roleFilter,
    statusFilter,
    usernameSearch,
  ])

  useEffect(() => {
    if (hasFilters && pagination && pagination.pageIndex > 0) {
      onPaginationChange?.((currentPagination) => ({
        ...currentPagination,
        pageIndex: 0,
      }))
    }
  }, [hasFilters, onPaginationChange, pagination])

  const resetFilters = () => {
    setUsernameSearch("")
    setEmailSearch("")
    setRoleFilter("all")
    setStatusFilter("all")
    setCreatedAtFilter("all")
  }

  return (
    <ResourceDataTable
      columns={columns}
      data={filteredData}
      toolbar={
        <div className="flex w-full min-w-0 flex-col gap-2 min-[1120px]:flex-row min-[1120px]:items-center">
          <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[720px]:grid-cols-2 min-[1120px]:max-w-[420px] min-[1120px]:shrink-0">
            <div className="relative min-w-0">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                aria-label="搜索用户名"
                value={usernameSearch}
                onChange={(event) => setUsernameSearch(event.target.value)}
                placeholder="用户名"
                className="h-9 w-full rounded-lg bg-background pr-3 pl-9"
              />
            </div>
            <div className="relative min-w-0">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                aria-label="搜索邮箱"
                value={emailSearch}
                onChange={(event) => setEmailSearch(event.target.value)}
                placeholder="邮箱"
                className="h-9 w-full rounded-lg bg-background pr-3 pl-9"
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 min-[1120px]:justify-end">
            <UserFilterMenu
              label={roleFilterLabels[roleFilter]}
              value={roleFilter}
              options={[
                { value: "all", label: "全部角色" },
                { value: "superuser", label: "超级用户" },
                { value: "user", label: "普通用户" },
              ]}
              onValueChange={setRoleFilter}
            />
            <UserFilterMenu
              label={statusFilterLabels[statusFilter]}
              value={statusFilter}
              options={[
                { value: "all", label: "全部状态" },
                { value: "active", label: "启用" },
                { value: "inactive", label: "停用" },
              ]}
              onValueChange={setStatusFilter}
            />
            <UserFilterMenu
              label={createdAtFilterLabels[createdAtFilter]}
              value={createdAtFilter}
              options={[
                { value: "all", label: "任意时间" },
                { value: "today", label: "今天" },
                { value: "7d", label: "最近 7 天" },
                { value: "30d", label: "最近 30 天" },
              ]}
              onValueChange={setCreatedAtFilter}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="h-[34px] rounded-md px-2 text-[13px]"
            >
              <X className="size-3.5" />
              重置
            </Button>
            {action}
          </div>
        </div>
      }
      emptyMessage="暂无用户。"
      loading={loading}
      error={error}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      pageCount={hasFilters ? 1 : pageCount}
      totalCount={hasFilters ? filteredData.length : totalCount}
      manualPagination={Boolean(pagination && onPaginationChange)}
      variant="shell"
    />
  )
}
