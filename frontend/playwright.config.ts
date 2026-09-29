import { defineConfig, devices } from "@playwright/test"
import { frontendBaseUrl } from "./tests/config"

const reportDirectory = process.env.PLAYWRIGHT_REPORT_DIR

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: reportDirectory ? `${reportDirectory}/results` : "test-results",
  reporter: [
    ["list"],
    ["html", {
      outputFolder: reportDirectory ? `${reportDirectory}/html` : "playwright-report",
      open: "never",
    }],
    ["junit", {
      outputFile: reportDirectory ? `${reportDirectory}/junit.xml` : "test-results/junit.xml",
    }],
  ],
  use: {
    baseURL: frontendBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "bun run dev",
        url: frontendBaseUrl,
        reuseExistingServer: !process.env.CI,
      },
})
