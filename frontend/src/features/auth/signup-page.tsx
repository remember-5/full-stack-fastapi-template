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
    email: z.email(),
    full_name: z.string().min(1, { message: "Full Name is required" }),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z
      .string()
      .min(1, { message: "Password confirmation is required" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "The passwords don't match",
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
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
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
                      <FieldLabel htmlFor="name">Full Name</FieldLabel>
                      <FormControl>
                        <Input
                          id="name"
                          data-testid="full-name-input"
                          placeholder="John Doe"
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
                      <FormMessage />
                    </Field>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
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
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                </Field>
                <Field>
                  <LoadingButton
                    type="submit"
                    loading={signUpMutation.isPending}
                  >
                    Sign Up
                  </LoadingButton>
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <RouterLink to="/login">Log in</RouterLink>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </Form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to the application account policies.
      </FieldDescription>
    </div>
  )
}
