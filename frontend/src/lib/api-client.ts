import type { AxiosResponse } from "axios"
import { client } from "@/client/client.gen"

export function configureApiClient(
  baseURL: string,
  getToken: () => string | null,
) {
  client.setConfig({
    auth: () => getToken() || undefined,
    baseURL,
  })
}

export function unwrapData<T>(response: AxiosResponse<T>): T {
  return response.data
}
