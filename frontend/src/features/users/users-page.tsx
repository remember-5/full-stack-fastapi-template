import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { PaginationState } from "@tanstack/react-table"
import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import { type UserPublic, usersReadUsers } from "@/client"
import { ResourcePage } from "@/features/resources/resource-page"
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
}: {
  pagination: PaginationState
  setPagination: Dispatch<SetStateAction<PaginationState>>
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
      error={isError ? "Unable to load users." : undefined}
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={Math.ceil(userCount / pagination.pageSize)}
      totalCount={userCount}
    />
  )
}

export function UsersPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  return (
    <ResourcePage
      title="Users"
      description="Manage user accounts, access, and account status."
      action={<CreateUserDialog />}
    >
      <UsersTableContent
        pagination={pagination}
        setPagination={setPagination}
      />
    </ResourcePage>
  )
}
