import { AppearanceMenu } from "@/components/app-shell/appearance-menu"
import { Logo } from "@/components/common/logo"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute right-4 top-4">
        <AppearanceMenu />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Logo variant="full" className="mx-auto h-7" />
        {children}
      </div>
    </div>
  )
}
