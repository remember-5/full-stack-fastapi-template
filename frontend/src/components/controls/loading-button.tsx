import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading?: boolean
}

function LoadingButton({
  loading = false,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  )
}

export { LoadingButton }
