import { Search } from "lucide-react"
import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"

export function DataTableToolbar({
  children,
  actions,
}: {
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-b px-5 py-3 xl:flex-row xl:items-center">
      <div className="flex w-full min-w-0 flex-1 flex-wrap items-center gap-2">
        {children}
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end">{actions}</div>
    </div>
  )
}

export function DataTableSearch({
  value,
  onChange,
  label,
  placeholder,
  maxLength,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  maxLength?: number
}) {
  return (
    <div className="relative w-full min-w-0 sm:w-44">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        className="h-9 pl-9"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
