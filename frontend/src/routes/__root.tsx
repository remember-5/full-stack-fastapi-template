import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router"
import { lazy, Suspense } from "react"
import ErrorComponent from "@/components/common/error-component"
import NotFound from "@/components/common/not-found"
import type { RouterContext } from "@/lib/router-context"

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : null

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <HeadContent />
      <Outlet />
      {TanStackRouterDevtools && ReactQueryDevtools ? (
        <Suspense fallback={null}>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      ) : null}
    </>
  ),
  notFoundComponent: () => <NotFound />,
  errorComponent: () => <ErrorComponent />,
})
