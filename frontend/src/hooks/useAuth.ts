import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import {
  type BodyLoginLoginAccessToken as AccessToken,
  loginLoginAccessToken,
  type UserRegister,
  usersRegisterUser,
} from "@/client"
import {
  type AuthRedirectPath,
  authController,
  currentUserQueryKey,
  currentUserQueryOptions,
} from "@/features/auth/auth-controller"
import { usersQueryKeys } from "@/features/users/user-query-keys"
import { unwrapData } from "@/lib/api-client"
import { handleApiError } from "@/lib/api-error"
import useCustomToast from "./useCustomToast"

const isLoggedIn = () => {
  return authController.isAuthenticated()
}

const useAuth = ({
  loginRedirectTo = "/",
}: {
  loginRedirectTo?: AuthRedirectPath
} = {}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const { data: user } = useQuery({
    ...currentUserQueryOptions(),
    enabled: isLoggedIn(),
  })

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      usersRegisterUser({ userRegister: data }),
    onSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: handleApiError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await loginLoginAccessToken({
      bodyLoginLoginAccessToken: data,
    })
    authController.setToken(unwrapData(response).access_token)
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
      navigate({ to: loginRedirectTo })
    },
    onError: handleApiError.bind(showErrorToast),
  })

  const logout = () => {
    authController.clearToken()
    queryClient.removeQueries({ queryKey: currentUserQueryKey })
    navigate({ to: "/login" })
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
  }
}

export { isLoggedIn }
export default useAuth
