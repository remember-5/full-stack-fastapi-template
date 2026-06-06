import { zodResolver } from "@hookform/resolvers/zod"
import { Link as RouterLink } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import type { BodyLoginLoginAccessToken as AccessToken } from "@/client"
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
import { Input } from "@/components/ui/input"
import type { AuthRedirectPath } from "@/features/auth/auth-controller"
import useAuth from "@/hooks/useAuth"

const formSchema = z.object({
  username: z.email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
}) satisfies z.ZodType<AccessToken>

type FormData = z.infer<typeof formSchema>

export function LoginPage({
  redirectTo = "/",
}: {
  redirectTo?: AuthRedirectPath
}) {
  const { loginMutation } = useAuth({ loginRedirectTo: redirectTo })
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Login with your email account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <FormControl>
                      <Input
                        id="email"
                        data-testid="email-input"
                        placeholder="m@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </Field>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <RouterLink
                        to="/recover-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </RouterLink>
                    </div>
                    <FormControl>
                      <PasswordInput
                        id="password"
                        data-testid="password-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </Field>
                )}
              />
              <Field>
                <LoadingButton type="submit" loading={loginMutation.isPending}>
                  Log In
                </LoadingButton>
                <FieldDescription className="text-center">
                  {"Don't have an account? "}
                  <RouterLink to="/signup">Sign up</RouterLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
