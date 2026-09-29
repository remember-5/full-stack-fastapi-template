import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
  path: [path.join(__dirname, "../.env"), path.join(__dirname, "../../.env")],
  quiet: true,
})

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is undefined`)
  }
  return value
}

export const firstSuperuser = getEnvVar("FIRST_SUPERUSER")
export const firstSuperuserPassword = getEnvVar("FIRST_SUPERUSER_PASSWORD")
export const frontendBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173"
export const apiBaseUrl =
  process.env.VITE_API_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://localhost:8000"
export const mailpitHost = process.env.MAILPIT_HOST ?? "http://localhost:8025"
