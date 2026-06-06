import { PageHeader } from "@/components/app-shell/page-header"
import { Card, CardContent } from "@/components/ui/card"

export function ResourcePage({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <PageHeader title={title} description={description} action={action} />
      <Card className="flex min-h-0 flex-1 overflow-hidden py-0">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
