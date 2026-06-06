import { PasswordInput } from "@/components/controls/password-input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ResourceFieldOption = {
  label: string
  value: string
}

export type ResourceFieldType =
  | "string"
  | "text"
  | "integer"
  | "float"
  | "decimal"
  | "boolean"
  | "enum"
  | "date"
  | "datetime"
  | "password"
  | "relation"

export type ResourceFieldConfig = {
  type: ResourceFieldType
  label: string
  description?: string
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  options?: ResourceFieldOption[]
}

export function ResourceField({
  config,
  field,
}: {
  config: ResourceFieldConfig
  field: {
    value: unknown
    onChange: (value: unknown) => void
    onBlur: () => void
    name: string
    ref: React.Ref<unknown>
  }
}) {
  const label = (
    <>
      {config.label}
      {config.required ? <span className="text-destructive"> *</span> : null}
    </>
  )

  if (config.type === "boolean") {
    return (
      <FormItem className="flex items-start gap-3 rounded-md border p-3">
        <FormControl>
          <Checkbox
            checked={Boolean(field.value)}
            disabled={config.readOnly}
            onCheckedChange={field.onChange}
          />
        </FormControl>
        <div className="grid gap-1.5 leading-none">
          <FormLabel>{label}</FormLabel>
          {config.description ? (
            <FormDescription>{config.description}</FormDescription>
          ) : null}
          <FormMessage />
        </div>
      </FormItem>
    )
  }

  if (config.type === "enum" || config.type === "relation") {
    const options = config.options ?? []
    const disabled = config.readOnly || options.length === 0

    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select
          disabled={disabled}
          value={typeof field.value === "string" ? field.value : ""}
          onValueChange={field.onChange}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  options.length ? config.placeholder : "No options available"
                }
              />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {config.description ? (
          <FormDescription>{config.description}</FormDescription>
        ) : null}
        <FormMessage />
      </FormItem>
    )
  }

  const inputType = {
    string: "text",
    text: "text",
    integer: "number",
    float: "number",
    decimal: "number",
    date: "date",
    datetime: "datetime-local",
    password: "password",
  }[config.type]

  const value =
    typeof field.value === "string" || typeof field.value === "number"
      ? field.value
      : ""

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        {config.type === "password" ? (
          <PasswordInput
            name={field.name}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
            placeholder={config.placeholder}
            readOnly={config.readOnly}
            ref={field.ref as React.Ref<HTMLInputElement>}
            value={value}
          />
        ) : (
          <Input
            name={field.name}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
            placeholder={config.placeholder}
            readOnly={config.readOnly}
            ref={field.ref as React.Ref<HTMLInputElement>}
            type={inputType}
            value={value}
          />
        )}
      </FormControl>
      {config.description ? (
        <FormDescription>{config.description}</FormDescription>
      ) : null}
      <FormMessage />
    </FormItem>
  )
}
