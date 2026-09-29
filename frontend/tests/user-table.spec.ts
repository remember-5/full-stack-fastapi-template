import { test as base, expect, type Page } from "@playwright/test"
import {
  type UserPublic,
  usersCreateUser,
  usersDeleteUser,
} from "../src/client"
import { apiBaseUrl } from "./config"
import { randomPassword, randomUsername } from "./utils/random"

const test = base.extend<{ cohort: { prefix: string; users: UserPublic[] } }>({
  cohort: async ({ page }, use) => {
    const state = await page.context().storageState()
    const token = state.origins
      .flatMap((origin) => origin.localStorage)
      .find((item) => item.name === "access_token")?.value
    if (!token) throw new Error("Missing authenticated test session")
    const options = {
      baseURL: apiBaseUrl,
      headers: { Authorization: `Bearer ${token}` },
    }
    const prefix = randomUsername()
    const users: UserPublic[] = []
    try {
      for (let index = 0; index < 11; index++) {
        const username = `${prefix}_${String(index).padStart(2, "0")}`
        const { data } = await usersCreateUser(
          {
            userCreate: {
              username,
              email: `${username}@example.com`,
              password: randomPassword(),
              full_name: `Table user ${index}`,
              is_active: index % 2 === 0,
              is_superuser: index === 0,
            },
          },
          options,
        )
        users.push(data)
      }
      await use({ prefix, users })
    } finally {
      for (const user of users) {
        const response = await usersDeleteUser(
          { user_id: user.id },
          { ...options, throwOnError: false },
        )
        expect([200, 404]).toContain(response.status)
      }
    }
  },
})

async function sortByUsername(page: Page, direction: "升序" | "降序") {
  await page
    .getByRole("button", { name: "用户名 打开列菜单", exact: true })
    .click()
  await page.getByRole("menuitem", { name: direction, exact: true }).click()
}

async function expectUsernames(page: Page, users: UserPublic[]) {
  await expect(page.locator("tbody tr")).toHaveCount(users.length)
  await expect(page.locator("tbody tr td:nth-child(2)")).toHaveText(
    users.map((user) => user.username),
  )
}

test("search and sorting apply across pages, and survive refresh and history", async ({
  page,
  cohort,
}) => {
  await page.goto("/admin?page=2")
  await expect(page.getByText(/第 2 \/ .* 页/)).toBeVisible()
  await page.getByRole("textbox", { name: "搜索用户名" }).fill(cohort.prefix)
  await sortByUsername(page, "升序")
  await expect(page.getByText("共 11 条", { exact: true })).toBeVisible()
  await expectUsernames(page, cohort.users.slice(0, 10))
  await expect(page.getByText("第 1 / 2 页", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "下一页", exact: true }).click()
  await expectUsernames(page, cohort.users.slice(10))
  await page.reload()
  await expectUsernames(page, cohort.users.slice(10))
  await expect(page.getByRole("textbox", { name: "搜索用户名" })).toHaveValue(
    cohort.prefix,
  )
  await page.goBack()
  await expectUsernames(page, cohort.users.slice(0, 10))
  await page.goForward()
  await expectUsernames(page, cohort.users.slice(10))
  await sortByUsername(page, "降序")
  await expectUsernames(page, [...cohort.users].reverse().slice(0, 10))
  await expect(
    page.getByRole("columnheader", { name: "用户名 打开列菜单", exact: true }),
  ).toHaveAttribute("aria-sort", "descending")
  await page.getByRole("combobox", { name: "每页条数" }).click()
  await page.getByRole("option", { name: "20", exact: true }).click()
  await expectUsernames(page, [...cohort.users].reverse())
  await expect(page.getByText("第 1 / 1 页", { exact: true })).toBeVisible()
  // Reset from an unsorted column must also clear the current global sort.
  await page
    .getByRole("button", { name: "邮箱 打开列菜单", exact: true })
    .click()
  await page
    .getByRole("menuitem", { name: "恢复默认排序", exact: true })
    .click()
  await expect(
    page.getByRole("columnheader", {
      name: "创建时间 打开列菜单",
      exact: true,
    }),
  ).toHaveAttribute("aria-sort", "descending")
  await expect(
    page.getByRole("columnheader", { name: "用户名 打开列菜单", exact: true }),
  ).not.toHaveAttribute("aria-sort", "descending")
})

test("combined filters, empty state and reset use server totals", async ({
  page,
  cohort,
}) => {
  await page.goto(`/admin?username=${cohort.prefix}&sort=username&order=asc`)
  await page.getByRole("button", { name: "状态", exact: true }).click()
  await page.getByRole("menuitemradio", { name: "停用", exact: true }).click()
  await page.getByRole("button", { name: "角色", exact: true }).click()
  await page
    .getByRole("menuitemradio", { name: "普通用户", exact: true })
    .click()
  await page.getByRole("button", { name: "创建时间", exact: true }).click()
  await page.getByRole("menuitemradio", { name: "今天", exact: true }).click()
  await expect(page.getByText("共 5 条", { exact: true })).toBeVisible()
  await expectUsernames(
    page,
    cohort.users.filter((user) => !user.is_active),
  )
  await page
    .getByRole("textbox", { name: "搜索邮箱" })
    .fill(cohort.users[1].email)
  await expectUsernames(page, [cohort.users[1]])
  await expect(page.getByText("共 1 条", { exact: true })).toBeVisible()
  await page.getByRole("textbox", { name: "搜索邮箱" }).fill("no-such-email")
  await expect(
    page.getByText("没有符合条件的用户。", { exact: true }),
  ).toBeVisible()
  await expect(page.getByText("共 0 条", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "重置", exact: true }).click()
  await expect(page.getByRole("textbox", { name: "搜索用户名" })).toHaveValue(
    "",
  )
  await expect(page.getByRole("textbox", { name: "搜索邮箱" })).toHaveValue("")
  for (const name of ["角色", "状态", "创建时间"])
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible()
})

test("columns can be hidden and restored without hiding row actions", async ({
  page,
}) => {
  await page.goto("/admin")
  const header = page.getByRole("columnheader", {
    name: "邮箱 打开列菜单",
    exact: true,
  })
  await header.getByRole("button").click()
  await page.getByRole("menuitem", { name: "隐藏列", exact: true }).click()
  await expect(header).toHaveCount(0)
  await page.getByRole("button", { name: "显示列", exact: true }).click()
  await expect(
    page.getByRole("menuitemcheckbox", { name: "操作", exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole("menuitemcheckbox", { name: "邮箱", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await expect(header).toBeVisible()
  await page.getByRole("button", { name: "显示列", exact: true }).click()
  for (const label of ["姓名", "用户名", "邮箱", "角色", "状态", "创建时间"]) {
    await page
      .getByRole("menuitemcheckbox", { name: label, exact: true })
      .click()
  }
  await page.keyboard.press("Escape")
  await expect(page.getByRole("columnheader")).toHaveCount(1)
  await expect(
    page.getByRole("button", { name: "打开用户操作" }).first(),
  ).toBeVisible()
  await page.getByRole("button", { name: "显示列", exact: true }).click()
  await page.getByRole("menuitem", { name: "恢复默认列", exact: true }).click()
  await expect(page.getByRole("columnheader")).toHaveCount(7)
})

test("deleting the last row on the last page returns to a valid page", async ({
  page,
  cohort,
}) => {
  await page.goto(
    `/admin?username=${cohort.prefix}&sort=username&order=asc&page=2`,
  )
  await expectUsernames(page, cohort.users.slice(10))
  await page.getByRole("button", { name: "打开用户操作" }).click()
  await page.getByRole("menuitem", { name: "删除用户", exact: true }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "删除", exact: true })
    .click()
  await expect(page.getByText("共 10 条", { exact: true })).toBeVisible()
  await expect(page.getByText("第 1 / 1 页", { exact: true })).toBeVisible()
  await expectUsernames(page, cohort.users.slice(0, 10))
})

test("search debounce cancels pending inputs on reset and merges both search fields", async ({
  page,
  cohort,
}) => {
  await page.goto("/admin")
  const requests: URL[] = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.pathname === "/api/v1/users/" && url.searchParams.has("username"))
      requests.push(url)
  })
  await page
    .getByRole("textbox", { name: "搜索用户名" })
    .pressSequentially(cohort.prefix, { delay: 10 })
  await page
    .getByRole("textbox", { name: "搜索邮箱" })
    .fill(cohort.users[3].email)
  await expectUsernames(page, [cohort.users[3]])
  expect(requests).toHaveLength(1)
  expect(requests[0].searchParams.get("email")).toBe(cohort.users[3].email)
  await page.getByRole("textbox", { name: "搜索用户名" }).fill("pending_reset")
  await page.getByRole("button", { name: "重置", exact: true }).click()
  await expect(page.locator("[aria-busy]")).toHaveAttribute(
    "aria-busy",
    "false",
  )
  await expect(page.getByRole("textbox", { name: "搜索用户名" })).toHaveValue(
    "",
  )
  expect(
    requests.some(
      (url) => url.searchParams.get("username") === "pending_reset",
    ),
  ).toBe(false)
})

test("invalid URL values recover, and a stale page is clamped", async ({
  page,
  cohort,
}) => {
  await page.goto(
    `/admin?username=${cohort.prefix}&sort=hashed_password&order=wrong&page=-2&pageSize=999`,
  )
  await expect(page.getByText("共 11 条", { exact: true })).toBeVisible()
  await expect(page.getByText("第 1 / 2 页", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("columnheader", {
      name: "创建时间 打开列菜单",
      exact: true,
    }),
  ).toHaveAttribute("aria-sort", "descending")
  await page.goto(`/admin?username=${cohort.prefix}&page=999`)
  await expect(page.getByText("第 2 / 2 页", { exact: true })).toBeVisible()
  await expect(page.locator("tbody tr")).toHaveCount(1)
})

test("table stays within the viewport on desktop and mobile", async ({
  page,
  cohort,
}, testInfo) => {
  await page.goto(`/admin?username=${cohort.prefix}&pageSize=20`)
  await expect(page.locator("tbody tr")).toHaveCount(11)
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    const overflow = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth > window.innerWidth,
      vertical: document.documentElement.scrollHeight > window.innerHeight,
    }))
    expect(overflow).toEqual({ horizontal: false, vertical: false })
    const area = page.getByTestId("resource-table-scroll-area")
    expect(
      await area.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    ).toBe(true)
    const header = page.getByRole("columnheader").first()
    const before = await header.boundingBox()
    await area.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    const after = await header.boundingBox()
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1)
    await page.screenshot({
      path: testInfo.outputPath(`table-${viewport.width}.png`),
      fullPage: true,
    })
  }
})

test("list errors offer a retry and recover without losing filters", async ({
  page,
}) => {
  await page.route("**/api/v1/users/?*", (route) =>
    route.fulfill({ status: 503, json: { detail: "Temporarily unavailable" } }),
  )
  await page.goto("/admin?username=no_such_table_test_user")
  await expect(page.getByRole("alert")).toContainText("无法加载用户。", {
    timeout: 15000,
  })
  await expect(
    page.getByRole("button", { name: "下一页", exact: true }),
  ).toBeDisabled()
  await page.unroute("**/api/v1/users/?*")
  await page.getByRole("button", { name: "重试", exact: true }).click()
  await expect(
    page.getByText("没有符合条件的用户。", { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("textbox", { name: "搜索用户名" })).toHaveValue(
    "no_such_table_test_user",
  )
})
