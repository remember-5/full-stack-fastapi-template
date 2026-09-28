import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { type UserUpdateMe, usersUpdateUserMe } from "@/client"
import { LoadingButton } from "@/components/controls/loading-button"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { currentUserQueryKey } from "@/features/auth/auth-controller"
import { usersQueryKeys } from "@/features/users/user-query-keys"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { unwrapData } from "@/lib/api-client"
import { handleApiError } from "@/lib/api-error"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  full_name: z.string().max(30).optional(),
  email: z.email({ message: "请输入有效的邮箱地址" }),
})

type FormData = z.infer<typeof formSchema>

const UserInformation = () => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [editMode, setEditMode] = useState(false)
  const { user: currentUser } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name ?? "",
      email: currentUser?.email ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      full_name: currentUser?.full_name ?? "",
      email: currentUser?.email ?? "",
    })
  }, [currentUser, form])

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      usersUpdateUserMe({ userUpdateMe: data }),
    onSuccess: (response) => {
      const updatedUser = unwrapData(response)
      queryClient.setQueryData(currentUserQueryKey, updatedUser)
      form.reset({
        full_name: updatedUser.full_name ?? "",
        email: updatedUser.email,
      })
      showSuccessToast("用户更新成功")
      setEditMode(false)
    },
    onError: handleApiError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })

  const onSubmit = (data: FormData) => {
    const updateData: UserUpdateMe = {}

    // only include fields that have changed
    if (data.full_name !== currentUser?.full_name) {
      updateData.full_name = data.full_name
    }
    if (data.email !== currentUser?.email) {
      updateData.email = data.email
    }

    mutation.mutate(updateData)
  }

  const onCancel = () => {
    form.reset({
      full_name: currentUser?.full_name ?? "",
      email: currentUser?.email ?? "",
    })
    setEditMode(false)
  }

  return (
    <div className="max-w-md">
      <div className="mb-4">
        <h3 className="font-semibold">用户信息</h3>
        <p className="text-sm text-muted-foreground">
          更新此账号使用的个人资料。
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) =>
              editMode ? (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) : (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <p
                    className={cn(
                      "py-2 truncate max-w-sm",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value || "暂无"}
                  </p>
                </FormItem>
              )
            }
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) =>
              editMode ? (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              ) : (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <p className="py-2 truncate max-w-sm">{field.value}</p>
                </FormItem>
              )
            }
          />

          <div className="flex gap-3">
            {editMode ? (
              <>
                <LoadingButton
                  type="submit"
                  loading={mutation.isPending}
                  disabled={!form.formState.isDirty}
                >
                  保存
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={mutation.isPending}
                >
                  取消
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setEditMode(true)}>
                编辑
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}

export default UserInformation
