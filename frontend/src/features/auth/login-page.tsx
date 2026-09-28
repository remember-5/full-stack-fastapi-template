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
  username: z.email({ message: "请输入有效的邮箱地址" }),
  password: z
    .string()
    .min(1, { message: "请输入密码" })
    .min(8, { message: "密码至少需要 8 个字符" }),
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
        <CardTitle className="text-xl">欢迎回来</CardTitle>
        <CardDescription>使用邮箱账号登录</CardDescription>
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
                    <FieldLabel htmlFor="email">邮箱</FieldLabel>
                    <FormControl>
                      <Input
                        id="email"
                        data-testid="email-input"
                        placeholder="请输入邮箱"
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
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <RouterLink
                        to="/recover-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        忘记密码？
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
                  登录
                </LoadingButton>
                <FieldDescription className="text-center">
                  还没有账号？ <RouterLink to="/signup">注册</RouterLink>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
