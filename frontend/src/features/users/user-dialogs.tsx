import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
    email: z.email({ message: "Invalid email address" }),
    full_name: z.string().optional(),
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    is_superuser: z.boolean(),
    is_active: z.boolean(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "The passwords don't match",
    path: ["confirm_password"],
  })

const updateUserSchema = z
  .object({
    email: z.email({ message: "Invalid email address" }),
    full_name: z.string().optional(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .optional()
      .or(z.literal("")),
    confirm_password: z.string().optional(),
    is_superuser: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => !data.password || data.password === data.confirm_password, {
    message: "The passwords don't match",
    path: ["confirm_password"],
  })

type CreateUserForm = z.infer<typeof createUserSchema>
type UpdateUserForm = z.infer<typeof updateUserSchema>

const createFields: Array<ResourceFormField<CreateUserForm>> = [
  {
    name: "email",
    label: "Email",
    type: "string",
    required: true,
    placeholder: "Email",
  },
  {
    name: "full_name",
    label: "Full name",
    type: "string",
    placeholder: "Full name",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    required: true,
    placeholder: "Password",
  },
  {
    name: "confirm_password",
    label: "Confirm password",
    type: "password",
    required: true,
    placeholder: "Password",
  },
  {
    name: "is_superuser",
    label: "Is superuser?",
    type: "boolean",
    description: "Allow this user to manage other users.",
  },
  {
    name: "is_active",
    label: "Is active?",
    type: "boolean",
    description: "Allow this user to sign in.",
  },
]

const updateFields: Array<ResourceFormField<UpdateUserForm>> = [
  {
    name: "email",
    label: "Email",
    type: "string",
    required: true,
    placeholder: "Email",
  },
  {
    name: "full_name",
    label: "Full name",
    type: "string",
    placeholder: "Full name",
  },
  {
    name: "password",
    label: "New password",
    type: "password",
    placeholder: "Leave blank to keep current password",
  },
  {
    name: "confirm_password",
    label: "Confirm password",
    type: "password",
  },
  {
    name: "is_superuser",
    label: "Is superuser?",
    type: "boolean",
    description: "Allow this user to manage other users.",
  },
  {
    name: "is_active",
    label: "Is active?",
    type: "boolean",
    description: "Allow this user to sign in.",
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
      showSuccessToast("User created successfully")
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
          Add User
        </Button>
      }
      title="Add user"
      description="Create a new account and assign its initial access."
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
  onSuccess: () => void
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
      password: "",
      confirm_password: "",
      is_superuser: user.is_superuser,
      is_active: user.is_active,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UpdateUserForm) =>
      usersUpdateUser({ user_id: user.id, userUpdate: data }),
    onSuccess: () => {
      showSuccessToast("User updated successfully")
      setOpen(false)
      onSuccess()
    },
    onError: handleApiError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.all })
    },
  })

  const onSubmit = (data: UpdateUserForm) => {
    const { confirm_password: _confirmPassword, ...submitData } = data
    if (!submitData.password) {
      delete submitData.password
    }
    mutation.mutate(submitData)
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
        Edit User
      </DropdownMenuItem>
      <ResourceFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit user"
        description="Update account information and access."
        form={form}
        fields={updateFields}
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
      showSuccessToast("The user was deleted successfully")
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
        Delete User
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            This user will be permanently deleted. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={mutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Delete
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
