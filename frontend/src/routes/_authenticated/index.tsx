import { createFileRoute } from "@tanstack/react-router"
import { DashboardPage } from "@/features/dashboard/dashboard-page"

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
  head: () => ({
    meta: [
      {
        title: "仪表盘 - FastAPI Template",
      },
    ],
  }),
})
