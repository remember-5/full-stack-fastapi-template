import { expect, type Page, test } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { createUser } from "./utils/privateApi.ts"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser, logOutUser } from "./utils/user"

const settingsSections = ["我的资料", "密码", "危险操作"]

async function openAccountSettingsDialog(page: Page) {
  await page.goto("/")
  const sidebarTrigger = page.getByRole("button", { name: "切换侧边栏" })
  if (await sidebarTrigger.isVisible().catch(() => false)) {
    await sidebarTrigger.click()
  }
  await page.getByTestId("user-menu").click()
  await page.getByRole("menuitem", { name: "账号设置" }).click()
  await expect(page.getByRole("dialog", { name: "账号设置" })).toBeVisible()
}

test("My profile section is active by default", async ({ page }) => {
  await openAccountSettingsDialog(page)

  await expect(page.getByRole("button", { name: "我的资料" })).toHaveAttribute(
    "data-active",
    "true",
  )
})

test("All settings sections are visible", async ({ page }) => {
  await openAccountSettingsDialog(page)
  for (const section of settingsSections) {
    await expect(page.getByRole("button", { name: section })).toBeVisible()
  }
})

test("Settings dialog opens from user menu", async ({ page }) => {
  await page.goto("/")
  await page.getByTestId("user-menu").click()
  await expect(page.getByRole("menuitem", { name: "个人信息" })).toHaveCount(0)
  await page.getByRole("menuitem", { name: "账号设置" }).click()

  await expect(page.getByRole("menu")).not.toBeVisible()
  await expect(page.getByRole("dialog", { name: "账号设置" })).toBeVisible()
  await expect(page.getByRole("button", { name: "我的资料" })).toBeVisible()
})

test("Settings sections can be switched on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openAccountSettingsDialog(page)

  await page.getByRole("combobox").click()
  await page.getByRole("option", { name: "密码" }).click()

  await expect(page.getByRole("heading", { name: "修改密码" })).toBeVisible()
})

test("Settings dialog does not include layout demo pages", async ({ page }) => {
  await openAccountSettingsDialog(page)

  for (const section of ["通知", "语言和地区", "已连接账号"]) {
    await expect(page.getByRole("button", { name: section })).toHaveCount(0)
  }
})

test.describe("Edit user profile", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  let password: string

  test.beforeAll(async () => {
    email = randomEmail()
    password = randomPassword()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await openAccountSettingsDialog(page)
  })

  test("Edit user name with a valid name", async ({ page }) => {
    const updatedName = "Test User 2"

    await page.getByRole("button", { name: "编辑" }).click()
    await page.getByLabel("姓名").fill(updatedName)
    await page.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("用户更新成功")).toBeVisible()
    await expect(
      page.locator("form").getByText(updatedName, { exact: true }),
    ).toBeVisible()
  })

  test("Edit user email with an invalid email shows error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "编辑" }).click()
    await page.getByLabel("邮箱").fill("")
    await page.keyboard.press("Tab")

    await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible()
  })
})

test.describe("Edit user email", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Edit user email with a valid email", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const updatedEmail = randomEmail()

    await createUser({ email, password })
    await logInUser(page, email, password)
    await openAccountSettingsDialog(page)

    await page.getByRole("button", { name: "编辑" }).click()
    await page.getByLabel("邮箱").fill(updatedEmail)
    await page.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("用户更新成功")).toBeVisible()
    await expect(
      page.locator("form").getByText(updatedEmail, { exact: true }),
    ).toBeVisible()
  })
})

test.describe("Cancel edit actions", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Cancel edit action restores original name", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const user = await createUser({ email, password })

    await logInUser(page, email, password)
    await openAccountSettingsDialog(page)
    await page.getByRole("button", { name: "编辑" }).click()
    await page.getByLabel("姓名").fill("Test User")
    await page.getByRole("button", { name: "取消" }).first().click()

    await expect(
      page.locator("form").getByText(user.full_name as string, { exact: true }),
    ).toBeVisible()
  })

  test("Cancel edit action restores original email", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    await createUser({ email, password })

    await logInUser(page, email, password)
    await openAccountSettingsDialog(page)
    await page.getByRole("button", { name: "编辑" }).click()
    await page.getByLabel("邮箱").fill(randomEmail())
    await page.getByRole("button", { name: "取消" }).first().click()

    await expect(
      page.locator("form").getByText(email, { exact: true }),
    ).toBeVisible()
  })
})

test.describe("Change password", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Update password successfully", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()
    const newPassword = randomPassword()

    await createUser({ email, password })
    await logInUser(page, email, password)

    await openAccountSettingsDialog(page)
    await page.getByRole("button", { name: "密码" }).click()
    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(newPassword)
    await page.getByTestId("confirm-password-input").fill(newPassword)
    await page.getByRole("button", { name: "更新密码" }).click()

    await expect(page.getByText("密码更新成功")).toBeVisible()

    await logOutUser(page)
    await logInUser(page, email, newPassword)
  })
})

test.describe("Change password validation", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  let password: string

  test.beforeAll(async () => {
    email = randomEmail()
    password = randomPassword()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
    await openAccountSettingsDialog(page)
    await page.getByRole("button", { name: "密码" }).click()
  })

  test("Update password with weak passwords", async ({ page }) => {
    const weakPassword = "weak"

    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(weakPassword)
    await page.getByTestId("confirm-password-input").fill(weakPassword)
    await page.getByRole("button", { name: "更新密码" }).click()

    await expect(page.getByText("密码至少需要 8 个字符")).toBeVisible()
  })

  test("New password and confirmation password do not match", async ({
    page,
  }) => {
    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(randomPassword())
    await page.getByTestId("confirm-password-input").fill(randomPassword())
    await page.getByRole("button", { name: "更新密码" }).click()

    await expect(page.getByText("两次输入的密码不一致")).toBeVisible()
  })

  test("Current password and new password are the same", async ({ page }) => {
    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(password)
    await page.getByTestId("confirm-password-input").fill(password)
    await page.getByRole("button", { name: "更新密码" }).click()

    await expect(page.getByText("新密码不能与当前密码相同")).toBeVisible()
  })
})

test("Appearance button is visible in sidebar", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("theme-button")).toBeVisible()
})

test("User can switch between theme modes", async ({ page }) => {
  await page.goto("/")

  await page.getByTestId("theme-button").click()
  await page.getByRole("menuitem", { name: "深色" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await expect(page.getByTestId("dark-mode")).not.toBeVisible()

  await page.getByTestId("theme-button").click()
  await page.getByRole("menuitem", { name: "浅色" }).click()
  await expect(page.locator("html")).toHaveClass(/light/)
})

test("Selected mode is preserved across sessions", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("vite-ui-theme", "dark")
  })
  await page.goto("/")

  let isDarkMode = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  )
  expect(isDarkMode).toBe(true)

  await logOutUser(page)
  await logInUser(page, firstSuperuser, firstSuperuserPassword)

  isDarkMode = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  )
  expect(isDarkMode).toBe(true)
})
