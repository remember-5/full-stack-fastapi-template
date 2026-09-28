import { AxiosError } from "axios"

type ApiErrorBody = {
  detail?: unknown
}

const localizedApiMessages: Record<string, string> = {
  "Incorrect email or password": "邮箱或密码不正确",
  "Invalid token": "重置链接无效或已过期",
  "New password cannot be the same as the current one":
    "新密码不能与当前密码相同",
  "Password updated successfully": "密码已更新",
  "User with this email already exists": "该邮箱已被注册",
}

function localizeApiMessage(message: string): string {
  return localizedApiMessages[message] ?? message
}

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = (err.response?.data as ApiErrorBody | undefined)?.detail
    if (Array.isArray(detail) && detail.length > 0) {
      const firstError = detail[0] as { msg?: string }
      return localizeApiMessage(firstError.msg ?? err.message)
    }
    return localizeApiMessage(typeof detail === "string" ? detail : err.message)
  }

  return "操作失败，请稍后重试。"
}

export function handleApiError(this: (message: string) => void, err: unknown) {
  this(getApiErrorMessage(err))
}

export function isUnauthorizedApiError(error: unknown) {
  return (
    error instanceof AxiosError &&
    [401, 403].includes(error.response?.status ?? 0)
  )
}
