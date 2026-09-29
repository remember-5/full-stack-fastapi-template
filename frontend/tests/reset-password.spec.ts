import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test"
import { waitForEmailHtml } from "./utils/mailpit"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser, signUpNewUser } from "./utils/user"

test.use({ storageState: { cookies: [], origins: [] } })

async function openResetEmail(
  page: Page,
  request: APIRequestContext,
  email: string,
) {
  const html = await waitForEmailHtml({ request, recipient: email })
  await page.setContent(html)
  const href = await page
    .locator('a[href*="/reset-password?token="]')
    .first()
    .getAttribute("href")
  if (!href) throw new Error("Password recovery email has no reset link")
  const link = new URL(href)
  // Use the configured browser target, including Docker and deployed test environments.
  await page.goto(`${link.pathname}${link.search}`)
}

test("Password recovery title is visible", async ({ page }) => {
  await page.goto("/recover-password")

  await expect(page.getByText("找回密码")).toBeVisible()
})

test("Input is visible, empty and editable", async ({ page }) => {
  await page.goto("/recover-password")

  await expect(page.getByTestId("email-input")).toBeVisible()
  await expect(page.getByTestId("email-input")).toHaveText("")
  await expect(page.getByTestId("email-input")).toBeEditable()
})

test("Continue button is visible", async ({ page }) => {
  await page.goto("/recover-password")

  await expect(page.getByRole("button", { name: "继续" })).toBeVisible()
})

test("User can reset password successfully using the link", async ({
  page,
  request,
}) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = randomPassword()
  const newPassword = randomPassword()

  // Sign up a new user
  await signUpNewUser(page, fullName, email, password)

  await page.goto("/recover-password")
  await page.getByTestId("email-input").fill(email)

  await page.getByRole("button", { name: "继续" }).click()

  await openResetEmail(page, request, email)

  await page.getByTestId("new-password-input").fill(newPassword)
  await page.getByTestId("confirm-password-input").fill(newPassword)
  await page.getByRole("button", { name: "重置密码" }).click()
  await expect(page.getByText("密码已更新")).toBeVisible()

  // Check if the user is able to login with the new password
  await logInUser(page, email, newPassword)
})

test("Expired or invalid reset link", async ({ page }) => {
  const password = randomPassword()
  const invalidUrl = "/reset-password?token=invalidtoken"

  await page.goto(invalidUrl)

  await page.getByTestId("new-password-input").fill(password)
  await page.getByTestId("confirm-password-input").fill(password)
  await page.getByRole("button", { name: "重置密码" }).click()

  await expect(page.getByText("重置链接无效或已过期")).toBeVisible()
})

test("Weak new password validation", async ({ page, request }) => {
  const fullName = "Test User"
  const email = randomEmail()
  const password = randomPassword()
  const weakPassword = "123"

  // Sign up a new user
  await signUpNewUser(page, fullName, email, password)

  await page.goto("/recover-password")
  await page.getByTestId("email-input").fill(email)
  await page.getByRole("button", { name: "继续" }).click()

  await openResetEmail(page, request, email)
  await page.getByTestId("new-password-input").fill(weakPassword)
  await page.getByTestId("confirm-password-input").fill(weakPassword)
  await page.getByRole("button", { name: "重置密码" }).click()

  await expect(page.getByText("密码至少需要 8 个字符")).toBeVisible()
})
