import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Link as RouterLink, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { loginResetPassword } from "@/client"
import { LoadingButton } from "@/components/controls/loading-button"
import { PasswordInput } from "@/components/controls/password-input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Form, FormControl, FormField, FormMessage } from "@/components/ui/form"
import useCustomToast from "@/hooks/useCustomToast"
import { handleApiError } from "@/lib/api-error"

const formSchema = z
  .object({
    new_password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z
      .string()
      .min(1, { message: "Password confirmation is required" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "The passwords don't match",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

export function ResetPasswordPage({ token }: { token: string }) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const navigate = useNavigate()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: { new_password: string; token: string }) =>
      loginResetPassword({ newPassword: data }),
    onSuccess: () => {
      showSuccessToast("Password updated successfully")
      form.reset()
      navigate({ to: "/login" })
    },
    onError: handleApiError.bind(showErrorToast),
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({ new_password: data.new_password, token })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="new-password">
                        New Password
                      </FieldLabel>
                      <FormControl>
                        <PasswordInput
                          id="new-password"
                          data-testid="new-password-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="confirm-password">
                        Confirm Password
                      </FieldLabel>
                      <FormControl>
                        <PasswordInput
                          id="confirm-password"
                          data-testid="confirm-password-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  )}
                />
                <Field>
                  <LoadingButton type="submit" loading={mutation.isPending}>
                    Reset Password
                  </LoadingButton>
                  <FieldDescription className="text-center">
                    Remember your password?{" "}
                    <RouterLink to="/login">Log in</RouterLink>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
