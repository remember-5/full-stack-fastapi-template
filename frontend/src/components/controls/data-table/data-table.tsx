import { flexRender, type Table as TableInstance } from "@tanstack/react-table"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTablePagination } from "./data-table-pagination"

export function DataTable<TData>({
  table,
  toolbar,
  loading = false,
  error,
  onRetry,
  emptyMessage = "暂无记录。",
}: {
  table: TableInstance<TData>
  toolbar?: ReactNode
  loading?: boolean
  error?: string
  onRetry?: () => void
  emptyMessage?: string
}) {
  const rows = table.getRowModel().rows
  const message =
    error ??
    (loading && !rows.length
      ? "正在加载记录..."
      : !rows.length
        ? emptyMessage
        : null)
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-card"
      aria-busy={loading}
    >
      {toolbar}
      <div
        className="min-h-0 flex-1 overflow-auto [&>[data-slot=table-container]]:overflow-visible"
        data-testid="resource-table-scroll-area"
      >
        <Table className="[&_td]:px-5 [&_td]:py-3 [&_th]:h-10 [&_th]:px-5">
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                    className="text-xs font-medium text-muted-foreground"
                  >
                    <DataTableColumnHeader header={header} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {message ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={Math.max(table.getVisibleLeafColumns().length, 1)}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div
                    role={error ? "alert" : "status"}
                    className="flex flex-col items-center gap-3"
                  >
                    {message}
                    {error && onRetry ? (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        重试
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
      <DataTablePagination table={table} disabled={loading || Boolean(error)} />
    </div>
  )
}
