import { usersRegisterUser } from "../../src/client"
import { configureApiClient, unwrapData } from "../../src/lib/api-client"
import { apiBaseUrl } from "../config"
import { randomUsername } from "./random"

configureApiClient(apiBaseUrl, () => null)

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  const response = await usersRegisterUser({
    userRegister: {
      email,
      username: randomUsername(),
      password,
      full_name: "Test User",
    },
  })
  return unwrapData(response)
}
