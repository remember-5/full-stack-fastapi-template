import { expect, type Page, test } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { randomPassword } from "./utils/random.ts"

test.use({ storageState: { cookies: [], origins: [] } })

const fillForm = async (page: Page, email: string, password: string) => {
  await page.getByTestId("email-input").fill(email)
  await page.getByTestId("password-input").fill(password)
}

const verifyInput = async (page: Page, testId: string) => {
  const input = page.getByTestId(testId)
  await expect(input).toBeVisible()
  await expect(input).toHaveText("")
  await expect(input).toBeEditable()
}

test("Inputs are visible, empty and editable", async ({ page }) => {
  await page.goto("/login")

  await verifyInput(page, "email-input")
  await verifyInput(page, "password-input")
})

test("Login button is visible", async ({ page }) => {
  await page.goto("/login")

  await expect(page.getByRole("button", { name: "登录" })).toBeVisible()
})

test("Forgot Password link is visible", async ({ page }) => {
  await page.goto("/login")

  await expect(page.getByRole("link", { name: "忘记密码？" })).toBeVisible()
})

test("Log in with valid email and password ", async ({ page }) => {
  await page.goto("/login")

  await fillForm(page, firstSuperuser, firstSuperuserPassword)
  await page.getByRole("button", { name: "登录" }).click()

  await page.waitForURL("/")

  await expect(page.getByText("账号", { exact: true })).toBeVisible()
})

test("Log in returns to the requested protected route", async ({ page }) => {
  await page.goto("/admin")
  await page.waitForURL(/\/login/)
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/admin")

  await fillForm(page, firstSuperuser, firstSuperuserPassword)
  await page.getByRole("button", { name: "登录" }).click()

  await page.waitForURL("/admin")
  await expect(page.getByRole("button", { name: "添加用户" })).toBeVisible()
  await expect(page.getByRole("textbox", { name: "搜索用户名" })).toBeVisible()
})

test("Logged-in user cannot access login page", async ({ page }) => {
  await page.goto("/login")

  await fillForm(page, firstSuperuser, firstSuperuserPassword)
  await page.getByRole("button", { name: "登录" }).click()
  await page.waitForURL("/")

  await page.goto("/login")
  await page.waitForURL("/")
})

test("Log in with invalid email", async ({ page }) => {
  await page.goto("/login")

  await fillForm(page, "invalidemail", firstSuperuserPassword)
  await page.getByRole("button", { name: "登录" }).click()

  await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible()
})

test("Log in with invalid password", async ({ page }) => {
  const password = randomPassword()

  await page.goto("/login")
  await fillForm(page, firstSuperuser, password)
  await page.getByRole("button", { name: "登录" }).click()

  await expect(page.getByText("邮箱或密码不正确")).toBeVisible()
})

test("Successful log out", async ({ page }) => {
  await page.goto("/login")

  await fillForm(page, firstSuperuser, firstSuperuserPassword)
  await page.getByRole("button", { name: "登录" }).click()

  await page.waitForURL("/")

  await expect(page.getByText("账号", { exact: true })).toBeVisible()

  await page.getByTestId("user-menu").click()
  await page.getByRole("menuitem", { name: "退出登录" }).click()
  await page.waitForURL("/login")
})

test("Logged-out user cannot access protected routes", async ({ page }) => {
  await page.goto("/login")

  await fillForm(page, firstSuperuser, firstSuperuserPassword)
  await page.getByRole("button", { name: "登录" }).click()

  await page.waitForURL("/")

  await expect(page.getByText("账号", { exact: true })).toBeVisible()

  await page.getByTestId("user-menu").click()
  await page.getByRole("menuitem", { name: "退出登录" }).click()
  await page.waitForURL("/login")

  await page.goto("/admin")
  await page.waitForURL(/\/login/)
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/admin")
})

test("Redirects to /login when token is wrong", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => {
    localStorage.setItem("access_token", "invalid_token")
  })
  await page.goto("/admin")
  await page.waitForURL(/\/login/)
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/admin")
})
