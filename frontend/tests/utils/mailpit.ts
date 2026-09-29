import type { APIRequestContext } from "@playwright/test"
import { mailpitHost } from "../config"

type SearchResult = { messages: { ID: string }[] }

export async function waitForEmailHtml({
  request,
  recipient,
  timeout = 10_000,
}: {
  request: APIRequestContext
  recipient: string
  timeout?: number
}) {
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    const response = await request.get(`${mailpitHost}/api/v1/search`, {
      params: { query: `to:"${recipient}"`, limit: 1 },
      timeout: Math.max(1, deadline - Date.now()),
    })
    if (!response.ok()) {
      throw new Error(`Mailpit search failed: HTTP ${response.status()}`)
    }
    const { messages }: SearchResult = await response.json()
    const email = messages[0]
    if (email) {
      const html = await request.get(`${mailpitHost}/view/${email.ID}.html`, {
        timeout: Math.max(1, deadline - Date.now()),
      })
      if (!html.ok()) {
        throw new Error(`Mailpit email retrieval failed: HTTP ${html.status()}`)
      }
      return html.text()
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`Timed out waiting for an email to ${recipient}`)
}
