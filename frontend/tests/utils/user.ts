import { expect, type Page } from "@playwright/test"
import { randomUsername } from "./random"

export async function signUpNewUser(
  page: Page,
  name: string,
  email: string,
  password: string,
) {
  await page.goto("/signup")

  await page.getByTestId("full-name-input").fill(name)
  await page.getByTestId("email-input").fill(email)
  await page.getByTestId("username-input").fill(randomUsername())
  await page.getByTestId("password-input").fill(password)
  await page.getByTestId("confirm-password-input").fill(password)
  await page.getByRole("button", { name: "注册" }).click()
  await page.goto("/login")
}

export async function logInUser(page: Page, email: string, password: string) {
  await page.goto("/login")

  await page.getByTestId("email-input").fill(email)
  await page.getByTestId("password-input").fill(password)
  await page.getByRole("button", { name: "登录" }).click()
  await page.waitForURL("/")
  await expect(page.getByText("账号", { exact: true })).toBeVisible()
}

export async function logOutUser(page: Page) {
  const openDialog = page.getByRole("dialog").first()

  if (await openDialog.isVisible().catch(() => false)) {
    await page.keyboard.press("Escape")
    await expect(openDialog).not.toBeVisible()
  }

  await page.getByTestId("user-menu").click()
  await page.getByRole("menuitem", { name: "退出登录" }).click()
  await page.goto("/login")
}
