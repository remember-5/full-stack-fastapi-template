import DeleteConfirmation from "./delete-confirmation"

const DeleteAccount = () => {
  return (
    <div className="max-w-md rounded-md border border-destructive/40 p-4">
      <h3 className="font-semibold text-destructive">Delete Account</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Permanently delete your account and all associated data.
      </p>
      <DeleteConfirmation />
    </div>
  )
}

export default DeleteAccount
