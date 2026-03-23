import { DeleteDialog } from '@/components/ui/delete-dialog'

interface DeleteWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
  workspaceCount?: number
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isDeleting = false,
  workspaceCount = 1,
}: DeleteWorkspaceDialogProps) {
  const isMultiple = workspaceCount > 1
  const title = isMultiple ? 'Delete Workspaces' : 'Delete Workspace'
  const description = isMultiple
    ? <>Are you sure you want to delete <span className="text-destructive font-bold text-lg">{workspaceCount}</span> workspaces? This action cannot be undone.</>
    : 'Are you sure you want to delete this workspace? This action cannot be undone.'

  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      onCancel={onCancel}
      title={title}
      description={description}
      isDeleting={isDeleting}
    />
  )
}
