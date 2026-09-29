import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { usersReadUsers } from "@/client"
import { CreateUserDialog } from "@/features/users/user-dialogs"
import { usersQueryKeys } from "@/features/users/user-query-keys"
import { UsersTable } from "@/features/users/users-table"
import useAuth from "@/hooks/useAuth"
import { unwrapData } from "@/lib/api-client"
import {
  type UpdateUserTableSearch,
  type UserTableSearch,
  userListQuery,
} from "./user-table-state"

export function UsersPage({
  search,
  onSearchChange,
}: {
  search: UserTableSearch
  onSearchChange: UpdateUserTableSearch
}) {
  const { user: currentUser } = useAuth()
  // Keep inputs and browser history in the URL; debounce only network requests.
  const searchText = JSON.stringify([search.username, search.email])
  const [debouncedText, setDebouncedText] = useState(searchText)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedText(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText])
  const isDebouncing = searchText !== debouncedText
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const query = userListQuery(search, today)
  const {
    data: users,
    isFetching,
    isPending,
    isError,
    isPlaceholderData,
    refetch,
  } = useQuery({
    queryKey: usersQueryKeys.list(query),
    queryFn: async ({ signal }) =>
      unwrapData(await usersReadUsers(query, { signal })),
    enabled: !isDebouncing,
    placeholderData: keepPreviousData,
  })
  const tableData = useMemo(
    () =>
      (users?.data ?? []).map((user) => ({
        ...user,
        isCurrentUser: currentUser?.id === user.id,
      })),
    [users?.data, currentUser?.id],
  )
  const userCount = users?.count ?? 0
  const lastPage = Math.max(1, Math.ceil(userCount / search.pageSize))
  useEffect(() => {
    // A deletion or a shared URL may leave the current page beyond the last page.
    if (
      users &&
      !isPlaceholderData &&
      !isFetching &&
      !isDebouncing &&
      !isError &&
      search.page > lastPage
    ) {
      onSearchChange({ page: lastPage }, { replace: true })
    }
  }, [
    users,
    isPlaceholderData,
    isFetching,
    isDebouncing,
    isError,
    search.page,
    lastPage,
    onSearchChange,
  ])

  return (
    <UsersTable
      data={tableData}
      loading={isPending || isFetching || isDebouncing}
      error={isError ? "无法加载用户。" : undefined}
      onRetry={() => void refetch()}
      search={search}
      onSearchChange={onSearchChange}
      totalCount={userCount}
      action={<CreateUserDialog />}
    />
  )
}
