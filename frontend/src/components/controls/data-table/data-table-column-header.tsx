import { flexRender, type Header } from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  EyeOff,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DataTableColumnHeader<TData, TValue>({
  header,
}: {
  header: Header<TData, TValue>
}) {
  if (header.isPlaceholder) return null
  const column = header.column
  const content = flexRender(column.columnDef.header, header.getContext())
  if (!column.getCanSort() && !column.getCanHide()) return content
  const sorting = column.getIsSorted()
  const Icon =
    sorting === "asc"
      ? ArrowUp
      : sorting === "desc"
        ? ArrowDown
        : ChevronsUpDown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span className="truncate">{content}</span>
          <Icon className="size-3.5" aria-hidden="true" />
          <span className="sr-only">打开列菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {column.getCanSort() ? (
          <>
            <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
              <ArrowUp />
              升序
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
              <ArrowDown />
              降序
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => header.getContext().table.resetSorting()}
            >
              <RotateCcw />
              恢复默认排序
            </DropdownMenuItem>
          </>
        ) : null}
        {column.getCanHide() ? (
          <>
            {column.getCanSort() ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOff />
              隐藏列
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
