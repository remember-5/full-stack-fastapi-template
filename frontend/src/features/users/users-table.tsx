import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown, EllipsisVertical, X } from "lucide-react"
import { type ReactNode, useState } from "react"
import type { UserPublic } from "@/client"
import { DataTable } from "@/components/controls/data-table/data-table"
import {
  DataTableSearch,
  DataTableToolbar,
} from "@/components/controls/data-table/data-table-toolbar"
import { DataTableViewOptions } from "@/components/controls/data-table/data-table-view-options"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChangeUserPasswordDialog,
  DeleteUserDialog,
  EditUserDialog,
} from "@/features/users/user-dialogs"
import { cn } from "@/lib/utils"
import {
  type UpdateUserTableSearch,
  type UserTableSearch,
  userTableSearchSchema,
} from "./user-table-state"

type UserTableData = UserPublic & {
  isCurrentUser: boolean
}

type UserRoleFilter = UserTableSearch["role"]
type UserStatusFilter = UserTableSearch["status"]
type UserCreatedAtFilter = UserTableSearch["created"]

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
  onRetry,
  search,
  onSearchChange,
  totalCount,
  action,
}: {
  data: UserTableData[]
  loading: boolean
  error?: string
  onRetry: () => void
  search: UserTableSearch
  onSearchChange: UpdateUserTableSearch
  totalCount: number
  action?: ReactNode
}) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const pagination = { pageIndex: search.page - 1, pageSize: search.pageSize }
  const sorting = [{ id: search.sort, desc: search.order === "desc" }]
  const table = useReactTable({
    data,
    columns,
    getRowId: (user) => user.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: false,
    rowCount: totalCount,
    state: { pagination, sorting, columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater
      onSearchChange({
        page: next.pageIndex + 1,
        pageSize: userTableSearchSchema.shape.pageSize.parse(next.pageSize),
      })
    },
    onSortingChange: (updater) => {
      const next = (
        typeof updater === "function" ? updater(sorting) : updater
      )[0]
      onSearchChange({
        page: 1,
        sort: userTableSearchSchema.shape.sort.parse(next?.id),
        order: next ? (next.desc ? "desc" : "asc") : "desc",
      })
    },
  })
  const hasFilters = Boolean(
    search.username ||
      search.email ||
      search.role !== "all" ||
      search.status !== "all" ||
      search.created !== "all",
  )
  const filter = (patch: Partial<UserTableSearch>, replace = false) =>
    onSearchChange({ ...patch, page: 1 }, { replace })

  return (
    <DataTable
      table={table}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyMessage={hasFilters ? "没有符合条件的用户。" : "暂无用户。"}
      toolbar={
        <DataTableToolbar
          actions={
            <>
              <DataTableViewOptions table={table} />
              {action}
            </>
          }
        >
          <DataTableSearch
            label="搜索用户名"
            placeholder="用户名"
            maxLength={50}
            value={search.username}
            onChange={(username) => filter({ username }, true)}
          />
          <DataTableSearch
            label="搜索邮箱"
            placeholder="邮箱"
            maxLength={255}
            value={search.email}
            onChange={(email) => filter({ email }, true)}
          />
          <UserFilterMenu
            label={roleFilterLabels[search.role]}
            value={search.role}
            options={[
              { value: "all", label: "全部角色" },
              { value: "superuser", label: "超级用户" },
              { value: "user", label: "普通用户" },
            ]}
            onValueChange={(role) => filter({ role })}
          />
          <UserFilterMenu
            label={statusFilterLabels[search.status]}
            value={search.status}
            options={[
              { value: "all", label: "全部状态" },
              { value: "active", label: "启用" },
              { value: "inactive", label: "停用" },
            ]}
            onValueChange={(status) => filter({ status })}
          />
          <UserFilterMenu
            label={createdAtFilterLabels[search.created]}
            value={search.created}
            options={[
              { value: "all", label: "任意时间" },
              { value: "today", label: "今天" },
              { value: "7d", label: "最近 7 天" },
              { value: "30d", label: "最近 30 天" },
            ]}
            onValueChange={(created) => filter({ created })}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!hasFilters}
            onClick={() =>
              filter({
                username: "",
                email: "",
                role: "all",
                status: "all",
                created: "all",
              })
            }
          >
            <X className="size-3.5" />
            重置
          </Button>
        </DataTableToolbar>
      }
    />
  )
}
