import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from "@tanstack/react-table"
import { EllipsisVertical } from "lucide-react"
import { useState } from "react"
import type { UserPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResourceDataTable } from "@/features/resources/resource-data-table"
import { DeleteUserDialog, EditUserDialog } from "@/features/users/user-dialogs"
import { cn } from "@/lib/utils"

export type UserTableData = UserPublic & {
  isCurrentUser: boolean
}

function UserActions({ user }: { user: UserTableData }) {
  const [open, setOpen] = useState(false)

  if (user.isCurrentUser) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <EllipsisVertical />
          <span className="sr-only">Open user actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditUserDialog user={user} onSuccess={() => setOpen(false)} />
        <DeleteUserDialog userId={user.id} onSuccess={() => setOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const columns: ColumnDef<UserTableData>[] = [
  {
    accessorKey: "full_name",
    header: "Name",
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
            {fullName || "N/A"}
          </span>
          {row.original.isCurrentUser ? (
            <Badge variant="outline">You</Badge>
          ) : null}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "is_superuser",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.original.is_superuser ? "default" : "secondary"}>
        {row.original.is_superuser ? "Superuser" : "User"}
      </Badge>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            row.original.is_active ? "bg-emerald-500" : "bg-muted-foreground",
          )}
        />
        <span className={row.original.is_active ? "" : "text-muted-foreground"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
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
}: {
  data: UserTableData[]
  loading?: boolean
  error?: React.ReactNode
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageCount?: number
  totalCount?: number
}) {
  return (
    <ResourceDataTable
      columns={columns}
      data={data}
      emptyMessage="No users found."
      loading={loading}
      error={error}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      pageCount={pageCount}
      totalCount={totalCount}
      manualPagination={Boolean(pagination && onPaginationChange)}
    />
  )
}
