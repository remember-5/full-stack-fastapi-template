import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { loginRecoverPassword } from "@/client"
import { LoadingButton } from "@/components/controls/loading-button"
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
import useCustomToast from "@/hooks/useCustomToast"
import { handleApiError } from "@/lib/api-error"

const formSchema = z.object({
  email: z.email({ message: "请输入有效的邮箱地址" }),
})

type FormData = z.infer<typeof formSchema>

export function RecoverPasswordPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const recoverPassword = async (data: FormData) => {
    await loginRecoverPassword({
      email: data.email,
    })
  }

  const mutation = useMutation({
    mutationFn: recoverPassword,
    onSuccess: () => {
      showSuccessToast("密码重置邮件已发送")
      form.reset()
    },
    onError: handleApiError.bind(showErrorToast),
  })

  const onSubmit = async (data: FormData) => {
    if (mutation.isPending) return
    mutation.mutate(data)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">找回密码</CardTitle>
          <CardDescription>输入邮箱，我们会发送重置说明。</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
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
                <Field>
                  <LoadingButton type="submit" loading={mutation.isPending}>
                    继续
                  </LoadingButton>
                  <FieldDescription className="text-center">
                    想起密码了？ <RouterLink to="/login">登录</RouterLink>
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
