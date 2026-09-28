import DeleteConfirmation from "./delete-confirmation"

const DeleteAccount = () => {
  return (
    <div className="max-w-md rounded-md border border-destructive/40 p-4">
      <h3 className="font-semibold text-destructive">删除账号</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        永久删除你的账号和所有关联数据。
      </p>
      <DeleteConfirmation />
    </div>
  )
}

export default DeleteAccount
