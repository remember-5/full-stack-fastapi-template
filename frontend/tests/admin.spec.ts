import { expect, type Locator, type Page, test } from "@playwright/test"
import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword, randomUsername } from "./utils/random"
import { logInUser } from "./utils/user"

async function openCreateUserDialog(page: Page) {
  await page.getByRole("button", { name: "添加用户" }).click()
  return page.getByRole("dialog")
}

async function fillCreateUserDialog(
  dialog: Locator,
  {
    email,
    username,
    password,
    fullName,
  }: {
    email: string
    username: string
    password: string
    fullName?: string
  },
) {
  await dialog.getByLabel("邮箱").fill(email)
  await dialog.getByLabel("用户名").fill(username)
  if (fullName !== undefined) {
    await dialog.getByLabel("姓名").fill(fullName)
  }
  await dialog.getByLabel(/^密码/).fill(password)
  await dialog.getByLabel("确认密码").fill(password)
}

test("Admin page is accessible and shows correct title", async ({ page }) => {
  await page.goto("/admin")
  await expect(page.getByRole("button", { name: "添加用户" })).toBeVisible()
  await expect(page.getByRole("textbox", { name: "搜索用户名" })).toBeVisible()
})

test("Add User button is visible", async ({ page }) => {
  await page.goto("/admin")
  await expect(page.getByRole("button", { name: "添加用户" })).toBeVisible()
})

test("Users table scrolls internally when showing 20 rows", async ({
  page,
}) => {
  await Promise.all(
    Array.from({ length: 22 }, () =>
      createUser({ email: randomEmail(), password: randomPassword() }),
    ),
  )

  await page.goto("/admin")
  await page.getByRole("combobox").click()
  await page.getByRole("option", { name: "20" }).click()

  const pageOverflows = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight,
  )
  const tableScrolls = await page
    .getByTestId("resource-table-scroll-area")
    .evaluate((element) => element.scrollHeight > element.clientHeight)

  expect(pageOverflows).toBe(false)
  expect(tableScrolls).toBe(true)
})

test.describe("Admin user management", () => {
  test("Create a new user successfully", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const username = randomUsername()
    const password = randomPassword()
    const fullName = "Test User Admin"

    const dialog = await openCreateUserDialog(page)
    await fillCreateUserDialog(dialog, { email, username, password, fullName })
    await dialog.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("用户创建成功")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await expect(userRow).toBeVisible()
    await expect(userRow.getByText(fullName)).toBeVisible()
    await expect(userRow.getByText(username)).toBeVisible()
  })

  test("Create a superuser", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const username = randomUsername()
    const password = randomPassword()

    const dialog = await openCreateUserDialog(page)
    await fillCreateUserDialog(dialog, { email, username, password })
    await dialog.getByLabel("超级用户").check()
    await dialog.getByLabel("启用账号").check()
    await dialog.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("用户创建成功")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await expect(userRow.getByText("超级用户")).toBeVisible()
  })

  test("Edit a user successfully", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const username = randomUsername()
    const password = randomPassword()
    const originalName = "Original Name"
    const updatedName = "Updated Name"

    const createDialog = await openCreateUserDialog(page)
    await fillCreateUserDialog(createDialog, {
      email,
      username,
      password,
      fullName: originalName,
    })
    await createDialog.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("用户创建成功")).toBeVisible()
    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await userRow.getByRole("button").click()

    await page.getByRole("menuitem", { name: "编辑用户" }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByLabel("用户名")).toHaveCount(0)
    await dialog.getByLabel("姓名").fill(updatedName)
    await dialog.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("用户更新成功")).toBeVisible()
    await expect(page.getByText(updatedName)).toBeVisible()
  })

  test("Delete a user successfully", async ({ page }) => {
    await page.goto("/admin")

    const email = randomEmail()
    const username = randomUsername()
    const password = randomPassword()

    const dialog = await openCreateUserDialog(page)
    await fillCreateUserDialog(dialog, { email, username, password })
    await dialog.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("用户创建成功")).toBeVisible()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    const userRow = page.getByRole("row").filter({ hasText: email })
    await userRow.getByRole("button").click()

    await page.getByRole("menuitem", { name: "删除用户" }).click()

    await page.getByRole("button", { name: "删除" }).click()

    await expect(page.getByText("用户已删除")).toBeVisible()

    await expect(
      page.getByRole("row").filter({ hasText: email }),
    ).not.toBeVisible()
  })

  test("Cancel user creation", async ({ page }) => {
    await page.goto("/admin")

    const dialog = await openCreateUserDialog(page)
    await dialog.getByLabel("邮箱").fill("test@example.com")
    await dialog.getByLabel("用户名").fill("test_user")

    await dialog.getByRole("button", { name: "取消" }).click()

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Email is required and must be valid", async ({ page }) => {
    await page.goto("/admin")

    const dialog = await openCreateUserDialog(page)

    await dialog.getByLabel("邮箱").fill("invalid-email")
    await dialog.getByLabel("邮箱").blur()

    await expect(page.getByText("请输入有效的邮箱地址")).toBeVisible()
  })

  test("Password must be at least 8 characters", async ({ page }) => {
    await page.goto("/admin")

    const dialog = await openCreateUserDialog(page)

    await dialog.getByLabel("邮箱").fill(randomEmail())
    await dialog.getByLabel("用户名").fill(randomUsername())
    await dialog.getByLabel(/^密码/).fill("short")
    await dialog.getByLabel("确认密码").fill("short")
    await dialog.getByRole("button", { name: "保存" }).click()

    await expect(page.getByText("密码至少需要 8 个字符")).toBeVisible()
  })

  test("Passwords must match", async ({ page }) => {
    await page.goto("/admin")

    const dialog = await openCreateUserDialog(page)

    await dialog.getByLabel("邮箱").fill(randomEmail())
    await dialog.getByLabel("用户名").fill(randomUsername())
    await dialog.getByLabel(/^密码/).fill(randomPassword())
    await dialog.getByLabel("确认密码").fill("different12345")
    await dialog.getByLabel("确认密码").blur()

    await expect(page.getByText("两次输入的密码不一致")).toBeVisible()
  })
})

test.describe("Admin page access control", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("Non-superuser cannot access admin page", async ({ page }) => {
    const email = randomEmail()
    const password = randomPassword()

    await createUser({ email, password })
    await logInUser(page, email, password)

    await page.goto("/admin")

    await expect(
      page.getByRole("button", { name: "添加用户" }),
    ).not.toBeVisible()
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test("Superuser can access admin page", async ({ page }) => {
    await logInUser(page, firstSuperuser, firstSuperuserPassword)

    await page.goto("/admin")

    await expect(page.getByRole("button", { name: "添加用户" })).toBeVisible()
  })
})
