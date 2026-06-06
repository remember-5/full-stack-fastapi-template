import { usersRegisterUser } from "../../src/client"
import { configureApiClient, unwrapData } from "../../src/lib/api-client"

configureApiClient(`${process.env.VITE_API_URL}`, () => null)

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
      password,
      full_name: "Test User",
    },
  })
  return unwrapData(response)
}
