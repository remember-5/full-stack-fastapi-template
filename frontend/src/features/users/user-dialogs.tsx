import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  type UserCreate,
  type UserPublic,
  usersCreateUser,
  usersDeleteUser,
  usersUpdateUser,
} from "@/client"
import { LoadingButton } from "@/components/controls/loading-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  ResourceFormDialog,
  type ResourceFormField,
} from "@/features/resources/resource-form-dialog"
import { usersQueryKeys } from "@/features/users/user-query-keys"
import useCustomToast from "@/hooks/useCustomToast"
import { handleApiError } from "@/lib/api-error"

const createUserSchema = z
  .object({
    email: z.email({ message: "请输入有效的邮箱地址" }),
    username: z
      .string()
      .min(3, { message: "用户名至少需要 3 个字符" })
      .max(50, { message: "用户名最多 50 个字符" })
      .regex(/^[a-z0-9_]+$/, {
        message: "用户名只能包含小写字母、数字和下划线",
      }),
    full_name: z.string().optional(),
    password: z
      .string()
      .min(1, { message: "请输入密码" })
      .min(8, { message: "密码至少需要 8 个字符" }),
    confirm_password: z.string().min(1, { message: "请确认密码" }),
    is_superuser: z.boolean(),
    is_active: z.boolean(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "两次输入的密码不一致",
    path: ["confirm_password"],
  })

const updateUserSchema = z.object({
  email: z.email({ message: "请输入有效的邮箱地址" }),
  full_name: z.string().optional(),
  is_superuser: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: "请输入密码" })
      .min(8, { message: "密码至少需要 8 个字符" }),
    confirm_password: z.string().min(1, { message: "请确认密码" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "两次输入的密码不一致",
    path: ["confirm_password"],
  })

type CreateUserForm = z.infer<typeof createUserSchema>
type UpdateUserForm = z.infer<typeof updateUserSchema>
type ChangePasswordForm = z.infer<typeof changePasswordSchema>

const createFields: Array<ResourceFormField<CreateUserForm>> = [
  {
    name: "email",
    label: "邮箱",
    type: "string",
    required: true,
    placeholder: "邮箱",
  },
  {
    name: "username",
    label: "用户名",
    type: "string",
    required: true,
    placeholder: "zhangsan",
  },
  {
    name: "full_name",
    label: "姓名",
    type: "string",
    placeholder: "姓名",
  },
  {
    name: "password",
    label: "密码",
    type: "password",
    required: true,
    placeholder: "密码",
  },
  {
    name: "confirm_password",
    label: "确认密码",
    type: "password",
    required: true,
    placeholder: "密码",
  },
  {
    name: "is_superuser",
    label: "超级用户",
    type: "boolean",
    description: "允许该用户管理其他用户。",
  },
  {
    name: "is_active",
    label: "启用账号",
    type: "boolean",
    description: "允许该用户登录。",
  },
]

const updateFields: Array<ResourceFormField<UpdateUserForm>> = [
  {
    name: "email",
    label: "邮箱",
    type: "string",
    required: true,
    placeholder: "邮箱",
  },
  {
    name: "full_name",
    label: "姓名",
    type: "string",
    placeholder: "姓名",
  },
  {
    name: "is_superuser",
    label: "超级用户",
    type: "boolean",
    description: "允许该用户管理其他用户。",
  },
  {
    name: "is_active",
    label: "启用账号",
    type: "boolean",
    description: "允许该用户登录。",
  },
]

const changePasswordFields: Array<ResourceFormField<ChangePasswordForm>> = [
  {
    name: "password",
    label: "新密码",
    type: "password",
    required: true,
    placeholder: "新密码",
  },
  {
    name: "confirm_password",
    label: "确认密码",
    type: "password",
    required: true,
    placeholder: "确认密码",
  },
]

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      username: "",
      full_name: "",
      password: "",
      confirm_password: "",
      is_superuser: false,
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserCreate) => usersCreateUser({ userCreate: data }),
    onSuccess: () => {
      showSuccessToast("用户创建成功")
      form.reset()
      setOpen(false)
    },
    onError: handleApiError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })

  const onSubmit = (data: CreateUserForm) => {
    const { confirm_password: _confirmPassword, ...submitData } = data
    mutation.mutate(submitData)
  }

  return (
    <ResourceFormDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus />
          添加用户
        </Button>
      }
      title="添加用户"
      description="创建新账号并设置初始权限。"
      form={form}
      fields={createFields}
      loading={mutation.isPending}
      onSubmit={onSubmit}
    />
  )
}

export function EditUserDialog({
  user,
  onSuccess,
}: {
  user: UserPublic
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: user.email,
      full_name: user.full_name ?? "",
      is_superuser: user.is_superuser,
      is_active: user.is_active,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UpdateUserForm) =>
      usersUpdateUser({ user_id: user.id, userUpdate: data }),
    onSuccess: () => {
      showSuccessToast("用户更新成功")
      setOpen(false)
      onSuccess?.()
    },
    onError: handleApiError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })

  const onSubmit = (data: UpdateUserForm) => {
    mutation.mutate(data)
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <Pencil />
        编辑用户
      </DropdownMenuItem>
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title="编辑用户"
        description="更新账号信息和访问权限。"
        form={form}
        fields={updateFields}
        loading={mutation.isPending}
        onSubmit={onSubmit}
      />
    </>
  )
}

export function ChangeUserPasswordDialog({
  user,
  onSuccess,
}: {
  user: UserPublic
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordForm) =>
      usersUpdateUser({
        user_id: user.id,
        userUpdate: { password: data.password },
      }),
    onSuccess: () => {
      showSuccessToast("密码更新成功")
      form.reset()
      setOpen(false)
      onSuccess?.()
    },
    onError: handleApiError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })

  const onSubmit = (data: ChangePasswordForm) => {
    mutation.mutate(data)
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <KeyRound />
        修改密码
      </DropdownMenuItem>
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title="修改密码"
        description={`为 ${user.email} 设置新密码。`}
        submitLabel="更新密码"
        form={form}
        fields={changePasswordFields}
        loading={mutation.isPending}
        onSubmit={onSubmit}
      />
    </>
  )
}

export function DeleteUserDialog({
  userId,
  onSuccess,
}: {
  userId: string
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => usersDeleteUser({ user_id: userId }),
    onSuccess: () => {
      showSuccessToast("用户已删除")
      setOpen(false)
      onSuccess()
    },
    onError: handleApiError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem
        variant="destructive"
        onSelect={(event) => {
          event.preventDefault()
          setOpen(true)
        }}
      >
        <Trash2 />
        删除用户
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>删除用户</DialogTitle>
          <DialogDescription>
            该用户将被永久删除，此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              取消
            </Button>
          </DialogClose>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            删除
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
