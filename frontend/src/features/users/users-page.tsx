import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"
import type { Dispatch, ReactNode, SetStateAction } from "react"
import { useState } from "react"
import { type UserPublic, usersReadUsers } from "@/client"
import { CreateUserDialog } from "@/features/users/user-dialogs"
import { usersQueryKeys } from "@/features/users/user-query-keys"
import { UsersTable, type UserTableData } from "@/features/users/users-table"
import useAuth from "@/hooks/useAuth"
import { unwrapData } from "@/lib/api-client"

function getUsersQueryOptions(pagination: PaginationState) {
  return {
    queryFn: async () =>
      unwrapData(
        await usersReadUsers({
          skip: pagination.pageIndex * pagination.pageSize,
          limit: pagination.pageSize,
        }),
      ),
    queryKey: usersQueryKeys.list(pagination),
  }
}

function UsersTableContent({
  pagination,
  setPagination,
  action,
}: {
  pagination: PaginationState
  setPagination: Dispatch<SetStateAction<PaginationState>>
  action: ReactNode
}) {
  const { user: currentUser } = useAuth()
  const {
    data: users,
    isFetching,
    isPending,
    isError,
  } = useQuery({
    ...getUsersQueryOptions(pagination),
    placeholderData: keepPreviousData,
  })
  const tableData: UserTableData[] = (users?.data ?? []).map(
    (user: UserPublic) => ({
      ...user,
      isCurrentUser: currentUser?.id === user.id,
    }),
  )
  const userCount = users?.count ?? 0

  return (
    <UsersTable
      data={tableData}
      loading={isPending || isFetching}
      error={isError ? "无法加载用户。" : undefined}
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={Math.ceil(userCount / pagination.pageSize)}
      totalCount={userCount}
      action={action}
    />
  )
}

export function UsersPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  return (
    <UsersTableContent
      pagination={pagination}
      setPagination={setPagination}
      action={<CreateUserDialog />}
    />
  )
}
