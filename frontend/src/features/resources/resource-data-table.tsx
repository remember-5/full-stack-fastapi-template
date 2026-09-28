import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  EyeOff,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const pageSizeOptions = [10, 20, 50, 100]

function DataTableColumnHeader<TData, TValue>({
  header,
}: {
  header: import("@tanstack/react-table").Header<TData, TValue>
}) {
  if (header.isPlaceholder) {
    return null
  }

  const content = flexRender(
    header.column.columnDef.header,
    header.getContext(),
  )
  const canSort = header.column.getCanSort()
  const canHide = header.column.getCanHide()

  if (!canSort && !canHide) {
    return content
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span className="truncate">{content}</span>
          <ChevronsUpDown className="size-3.5" aria-hidden="true" />
          <span className="sr-only">打开列菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {canSort ? (
          <>
            <DropdownMenuItem
              onSelect={() => header.column.toggleSorting(false)}
            >
              <ArrowUp />
              升序
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => header.column.toggleSorting(true)}
            >
              <ArrowDown />
              降序
            </DropdownMenuItem>
          </>
        ) : null}
        {canHide ? (
          <DropdownMenuItem
            onSelect={() => header.column.toggleVisibility(false)}
          >
            <EyeOff />
            隐藏列
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ResourceDataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  emptyMessage = "暂无记录。",
  loading = false,
  loadingMessage = "正在加载记录...",
  error,
  errorMessage = "无法加载记录。",
  pagination,
  onPaginationChange,
  pageCount,
  totalCount,
  manualPagination = false,
  variant = "default",
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: React.ReactNode
  emptyMessage?: string
  loading?: boolean
  loadingMessage?: string
  error?: React.ReactNode
  errorMessage?: string
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageCount?: number
  totalCount?: number
  manualPagination?: boolean
  variant?: "default" | "shell"
}) {
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    },
  )
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const tablePagination = pagination ?? internalPagination
  const handlePaginationChange = onPaginationChange ?? setInternalPagination
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: tablePagination,
      sorting,
      columnVisibility,
    },
    onPaginationChange: handlePaginationChange,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    manualPagination,
    pageCount,
  })
  const totalRecords = totalCount ?? data.length
  const firstRecord = totalRecords
    ? tablePagination.pageIndex * tablePagination.pageSize + 1
    : 0
  const lastRecord = Math.min(
    (tablePagination.pageIndex + 1) * tablePagination.pageSize,
    totalRecords,
  )
  const displayPageCount = Math.max(table.getPageCount(), 1)
  const rowCount = table.getRowModel().rows.length
  const stateMessage =
    error !== undefined
      ? error || errorMessage
      : loading && !rowCount
        ? loadingMessage
        : rowCount
          ? null
          : emptyMessage
  const isShell = variant === "shell"

  return (
    <div
      className={
        isShell
          ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-card"
          : "flex min-h-0 flex-1 flex-col"
      }
      aria-busy={loading}
    >
      {isShell && toolbar ? (
        <div className="flex shrink-0 flex-col gap-3 border-b px-5 py-3 min-[860px]:min-h-14 min-[860px]:flex-row min-[860px]:items-center min-[860px]:justify-start min-[860px]:py-0">
          {toolbar}
        </div>
      ) : null}
      <div
        className="min-h-0 flex-1 overflow-auto"
        data-testid="resource-table-scroll-area"
      >
        <Table
          className={
            isShell
              ? "[&_td]:px-5 [&_td]:py-3 [&_th]:h-10 [&_th]:px-5"
              : undefined
          }
        >
          <TableHeader
            className={
              isShell
                ? "sticky top-0 z-10 bg-card"
                : "sticky top-0 z-10 bg-background"
            }
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      isShell
                        ? "text-xs font-medium text-muted-foreground"
                        : undefined
                    }
                  >
                    <DataTableColumnHeader header={header} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {stateMessage ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  {stateMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalRecords || isShell ? (
        <div
          className={
            isShell
              ? "flex shrink-0 flex-col gap-4 border-t px-5 py-4 min-[860px]:h-16 min-[860px]:flex-row min-[860px]:items-center min-[860px]:justify-between min-[860px]:py-0"
              : "flex shrink-0 flex-col gap-4 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          }
        >
          {isShell ? (
            <p className="text-[13px] text-muted-foreground">
              总条数: {totalRecords}
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                显示第 {firstRecord} 到 {lastRecord} 条，共{" "}
                <span className="font-medium text-foreground">
                  {totalRecords}
                </span>{" "}
                条
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页</span>
                <Select
                  value={`${tablePagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {pageSizeOptions.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isShell ? (
              <Select
                value={`${tablePagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 rounded-md bg-card px-2.5 text-[13px] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                第{" "}
                <span className="font-medium text-foreground">
                  {tablePagination.pageIndex + 1}
                </span>{" "}
                /{" "}
                <span className="font-medium text-foreground">
                  {displayPageCount}
                </span>{" "}
                页
              </p>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant={isShell ? "ghost" : "outline"}
                size="icon-sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">跳到第一页</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant={isShell ? "ghost" : "outline"}
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">上一页</span>
                <ChevronLeft />
              </Button>
              {isShell ? (
                <Button size="icon-sm" aria-current="page" disabled>
                  {tablePagination.pageIndex + 1}
                </Button>
              ) : null}
              <Button
                variant={isShell ? "ghost" : "outline"}
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">下一页</span>
                <ChevronRight />
              </Button>
              <Button
                variant={isShell ? "ghost" : "outline"}
                size="icon-sm"
                onClick={() => table.setPageIndex(displayPageCount - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">跳到最后一页</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
