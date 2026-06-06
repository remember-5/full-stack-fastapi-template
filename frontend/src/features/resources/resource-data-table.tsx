import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type OnChangeFn,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
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

const pageSizeOptions = [5, 10, 20, 50]

export function ResourceDataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No records found.",
  loading = false,
  loadingMessage = "Loading records...",
  error,
  errorMessage = "Unable to load records.",
  pagination,
  onPaginationChange,
  pageCount,
  totalCount,
  manualPagination = false,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
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
}) {
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    },
  )
  const tablePagination = pagination ?? internalPagination
  const handlePaginationChange = onPaginationChange ?? setInternalPagination
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: tablePagination,
    },
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
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

  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy={loading}>
      <div
        className="min-h-0 flex-1 overflow-auto"
        data-testid="resource-table-scroll-area"
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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

      {totalRecords ? (
        <div className="flex shrink-0 flex-col gap-4 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              Showing {firstRecord} to {lastRecord} of{" "}
              <span className="font-medium text-foreground">
                {totalRecords}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows</span>
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

          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {tablePagination.pageIndex + 1}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {displayPageCount}
              </span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.setPageIndex(displayPageCount - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
