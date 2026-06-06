import { AxiosError } from "axios"

type ApiErrorBody = {
  detail?: unknown
}

export function getApiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const detail = (err.response?.data as ApiErrorBody | undefined)?.detail
    if (Array.isArray(detail) && detail.length > 0) {
      const firstError = detail[0] as { msg?: string }
      return firstError.msg ?? err.message
    }
    return typeof detail === "string" ? detail : err.message
  }

  return "Something went wrong."
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
