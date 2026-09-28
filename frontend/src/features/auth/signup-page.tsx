import { zodResolver } from "@hookform/resolvers/zod"
import { Link as RouterLink } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import useAuth from "@/hooks/useAuth"

const formSchema = z
  .object({
    email: z.email({ message: "请输入有效的邮箱地址" }),
    username: z
      .string()
      .min(3, { message: "用户名至少需要 3 个字符" })
      .max(50, { message: "用户名最多 50 个字符" })
      .regex(/^[a-z0-9_]+$/, {
        message: "用户名只能包含小写字母、数字和下划线",
      }),
    full_name: z.string().min(1, { message: "请输入姓名" }),
    password: z
      .string()
      .min(1, { message: "请输入密码" })
      .min(8, { message: "密码至少需要 8 个字符" }),
    confirm_password: z.string().min(1, { message: "请再次输入密码" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "两次输入的密码不一致",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

export function SignUpPage() {
  const { signUpMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      username: "",
      full_name: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (signUpMutation.isPending) return

    // exclude confirm_password from submission data
    const { confirm_password: _confirm_password, ...submitData } = data
    signUpMutation.mutate(submitData)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">创建账号</CardTitle>
          <CardDescription>输入邮箱并创建你的账号</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="name">姓名</FieldLabel>
                      <FormControl>
                        <Input
                          id="name"
                          data-testid="full-name-input"
                          placeholder="张三"
                          type="text"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
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
                      <FormMessage />
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="username">用户名</FieldLabel>
                      <FormControl>
                        <Input
                          id="username"
                          data-testid="username-input"
                          placeholder="john_doe"
                          type="text"
                          autoCapitalize="none"
                          autoCorrect="off"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="password">密码</FieldLabel>
                      <FormControl>
                        <PasswordInput
                          id="password"
                          data-testid="password-input"
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
                        确认密码
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
                  <FieldDescription>密码至少 8 个字符。</FieldDescription>
                </Field>
                <Field>
                  <LoadingButton
                    type="submit"
                    loading={signUpMutation.isPending}
                  >
                    注册
                  </LoadingButton>
                  <FieldDescription className="text-center">
                    已经有账号？ <RouterLink to="/login">登录</RouterLink>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </Form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        点击继续即表示你同意应用账号政策。
      </FieldDescription>
    </div>
  )
}
