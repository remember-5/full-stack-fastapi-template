import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { LoadingButton } from "@/components/controls/loading-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormField } from "@/components/ui/form"
import {
  ResourceField,
  type ResourceFieldConfig,
} from "@/features/resources/resource-fields"

export type ResourceFormField<TValues extends FieldValues> =
  ResourceFieldConfig & {
    name: Path<TValues>
  }

export function ResourceFormDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  submitLabel = "Save",
  form,
  fields,
  loading,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
  title: string
  description?: string
  submitLabel?: string
  form: UseFormReturn<TValues>
  fields: Array<ResourceFormField<TValues>>
  loading?: boolean
  onSubmit: (values: TValues) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {fields.map((fieldConfig) => (
                <FormField
                  key={fieldConfig.name}
                  control={form.control}
                  name={fieldConfig.name}
                  render={({ field }) => (
                    <ResourceField config={fieldConfig} field={field} />
                  )}
                />
              ))}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton type="submit" loading={loading}>
                {submitLabel}
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
