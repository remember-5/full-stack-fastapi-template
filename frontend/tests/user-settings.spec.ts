import { expect, type Page, test } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { createUser } from "./utils/privateApi.ts"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser, logOutUser } from "./utils/user"

const settingsSections = ["My profile", "Password", "Danger zone"]

async function openAccountSettingsDialog(page: Page) {
  await page.goto("/")
  const sidebarTrigger = page.getByRole("button", { name: "Toggle Sidebar" })
  if (await sidebarTrigger.isVisible().catch(() => false)) {
    await sidebarTrigger.click()
  }
  await page.getByTestId("user-menu").click()
  await page.getByRole("menuitem", { name: "Account settings" }).click()
  await expect(
    page.getByRole("dialog", { name: "Account settings" }),
  ).toBeVisible()
}

test("My profile section is active by default", async ({ page }) => {
  await openAccountSettingsDialog(page)

  await expect(
    page.getByRole("button", { name: "My profile" }),
  ).toHaveAttribute("data-active", "true")
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
  await expect(
    page.getByRole("menuitem", { name: "Personal info" }),
  ).toHaveCount(0)
  await page.getByRole("menuitem", { name: "Account settings" }).click()

  await expect(page.getByRole("menu")).not.toBeVisible()
  await expect(
    page.getByRole("dialog", { name: "Account settings" }),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "My profile" })).toBeVisible()
})

test("Settings sections can be switched on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openAccountSettingsDialog(page)

  await page.getByRole("combobox").click()
  await page.getByRole("option", { name: "Password" }).click()

  await expect(
    page.getByRole("heading", { name: "Change password" }),
  ).toBeVisible()
})

test("Settings dialog does not include layout demo pages", async ({ page }) => {
  await openAccountSettingsDialog(page)

  for (const section of [
    "Notifications",
    "Language & region",
    "Connected accounts",
  ]) {
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

    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Full name").fill(updatedName)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User updated successfully")).toBeVisible()
    await expect(
      page.locator("form").getByText(updatedName, { exact: true }),
    ).toBeVisible()
  })

  test("Edit user email with an invalid email shows error", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill("")
    await page.keyboard.press("Tab")

    await expect(page.getByText("Invalid email address")).toBeVisible()
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

    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(updatedEmail)
    await page.getByRole("button", { name: "Save" }).click()

    await expect(page.getByText("User updated successfully")).toBeVisible()
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
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Full name").fill("Test User")
    await page.getByRole("button", { name: "Cancel" }).first().click()

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
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(randomEmail())
    await page.getByRole("button", { name: "Cancel" }).first().click()

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
    await page.getByRole("button", { name: "Password" }).click()
    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(newPassword)
    await page.getByTestId("confirm-password-input").fill(newPassword)
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(page.getByText("Password updated successfully")).toBeVisible()

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
    await page.getByRole("button", { name: "Password" }).click()
  })

  test("Update password with weak passwords", async ({ page }) => {
    const weakPassword = "weak"

    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(weakPassword)
    await page.getByTestId("confirm-password-input").fill(weakPassword)
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible()
  })

  test("New password and confirmation password do not match", async ({
    page,
  }) => {
    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(randomPassword())
    await page.getByTestId("confirm-password-input").fill(randomPassword())
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(page.getByText("The passwords don't match")).toBeVisible()
  })

  test("Current password and new password are the same", async ({ page }) => {
    await page.getByTestId("current-password-input").fill(password)
    await page.getByTestId("new-password-input").fill(password)
    await page.getByTestId("confirm-password-input").fill(password)
    await page.getByRole("button", { name: "Update Password" }).click()

    await expect(
      page.getByText("New password cannot be the same as the current one"),
    ).toBeVisible()
  })
})

test("Appearance button is visible in sidebar", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByTestId("theme-button")).toBeVisible()
})

test("User can switch between theme modes", async ({ page }) => {
  await page.goto("/")

  await page.getByTestId("theme-button").click()
  await page.getByRole("menuitem", { name: "Dark" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await expect(page.getByTestId("dark-mode")).not.toBeVisible()

  await page.getByTestId("theme-button").click()
  await page.getByRole("menuitem", { name: "Light" }).click()
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
