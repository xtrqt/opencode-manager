import { useState, useMemo } from 'react'
import { useSessionList, useDeleteSession } from '@/hooks/useSessions'
import { ListToolbar } from '@/components/ui/list-toolbar'
import { DeleteWorkspaceDialog } from '@/components/workspace/DeleteWorkspaceDialog'
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard'
import type { SessionDetail } from '@opencode-manager/shared'
import { sessionsApi } from '@/api/sessions'
import { useNavigate } from 'react-router-dom'
import { showToast } from '@/lib/toast'

interface WorkspaceListProps {
  activeWorkspaceId?: string
  onSelectWorkspace: (workspaceId: string) => void
}

export function WorkspaceList({ activeWorkspaceId, onSelectWorkspace }: WorkspaceListProps) {
  const navigate = useNavigate()
  const { data: workspaces, isLoading } = useSessionList()
  const deleteWorkspace = useDeleteSession()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | string[] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Set<string>>(new Set())
  const [manageMode, setManageMode] = useState(false)

  const filteredWorkspaces = useMemo(() => {
    if (!workspaces) return []

    let filtered = workspaces

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((workspace) =>
        workspace.name.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0))
  }, [workspaces, searchQuery])

  const todayWorkspaces = useMemo(() => {
    if (!filteredWorkspaces) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return filteredWorkspaces.filter((workspace) => new Date(workspace.lastActiveAt || 0) >= today)
  }, [filteredWorkspaces])

  const olderWorkspaces = useMemo(() => {
    if (!filteredWorkspaces) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return filteredWorkspaces.filter((workspace) => new Date(workspace.lastActiveAt || 0) < today)
  }, [filteredWorkspaces])

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading workspaces...</div>
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No workspaces yet. Create one to get started.
      </div>
    )
  }

  const handleDelete = (workspaceId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setWorkspaceToDelete(workspaceId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (workspaceToDelete) {
      if (Array.isArray(workspaceToDelete)) {
        for (const workspaceId of workspaceToDelete) {
          await deleteWorkspace.mutateAsync({ id: workspaceId })
        }
      } else {
        await deleteWorkspace.mutateAsync({ id: workspaceToDelete })
      }
      setDeleteDialogOpen(false)
      setWorkspaceToDelete(null)
      setSelectedWorkspaces(new Set())
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setWorkspaceToDelete(null)
    setSelectedWorkspaces(new Set())
  }

  const toggleWorkspaceSelection = (workspaceId: string, selected: boolean) => {
    const newSelected = new Set(selectedWorkspaces)
    if (selected) {
      newSelected.add(workspaceId)
    } else {
      newSelected.delete(workspaceId)
    }
    setSelectedWorkspaces(newSelected)
  }

  const toggleManageMode = () => {
    setManageMode((prev) => {
      if (!prev) {
        return true
      }
      setSelectedWorkspaces(new Set())
      return false
    })
  }

  const toggleSelectAll = () => {
    if (!filteredWorkspaces || filteredWorkspaces.length === 0) return

    const allFilteredSelected = filteredWorkspaces.every((workspace) =>
      selectedWorkspaces.has(workspace.id)
    )

    if (allFilteredSelected) {
      setSelectedWorkspaces(new Set())
    } else {
      const filteredIds = filteredWorkspaces.map((workspace) => workspace.id)
      setSelectedWorkspaces(new Set(filteredIds))
    }
  }

  const handleBulkDelete = () => {
    if (selectedWorkspaces.size > 0) {
      setWorkspaceToDelete(Array.from(selectedWorkspaces))
      setDeleteDialogOpen(true)
    }
  }

  const handleDeleteAll = () => {
    if (!filteredWorkspaces || filteredWorkspaces.length === 0) return
    setWorkspaceToDelete(filteredWorkspaces.map((workspace) => workspace.id))
    setDeleteDialogOpen(true)
  }

  const openWorkspaceSession = async (workspace: SessionDetail) => {
    if (workspace.status !== 'running') {
      onSelectWorkspace(workspace.id)
      return
    }
    try {
      const created = await sessionsApi.getOrCreateOpenCodeSession(workspace.id)
      if (!created || typeof created !== 'object' || !('id' in created)) {
        showToast.error('Failed to create OpenCode session')
        return
      }
      navigate(`/workspace/${workspace.id}/sessions/${created.id as string}`)
    } catch {
      showToast.error('Failed to open OpenCode')
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-2 flex-shrink-0">
        <ListToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCount={selectedWorkspaces.size}
          totalCount={filteredWorkspaces.length}
          allSelected={
            filteredWorkspaces.length > 0 &&
            filteredWorkspaces.every((workspace) => selectedWorkspaces.has(workspace.id))
          }
          onToggleSelectAll={toggleSelectAll}
          onDelete={handleBulkDelete}
          onDeleteAll={handleDeleteAll}
          manageMode={manageMode}
          onToggleManageMode={toggleManageMode}
          searchPlaceholder="Search"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-4 min-h-0 [mask-image:linear-gradient(to_bottom,transparent,black_16px,black)]">
        <div className="flex flex-col gap-4">
          {filteredWorkspaces.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No workspaces found
            </div>
          ) : (
            <>
              {todayWorkspaces.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-muted-foreground px-1 py-2">
                    Today
                  </div>
                  {todayWorkspaces.map((workspace) => (
                    <WorkspaceCard
                      key={workspace.id}
                      workspace={workspace}
                      isSelected={selectedWorkspaces.has(workspace.id)}
                      isActive={activeWorkspaceId === workspace.id}
                      manageMode={manageMode}
                      onSelect={() => openWorkspaceSession(workspace)}
                      onOpenDetails={(workspaceId) => onSelectWorkspace(workspaceId)}
                      onToggleSelection={(selected) => {
                        toggleWorkspaceSelection(workspace.id, selected)
                      }}
                      onDelete={(e) => handleDelete(workspace.id, e)}
                    />
                  ))}
                </>
              )}

              {todayWorkspaces.length > 0 && olderWorkspaces.length > 0 && (
                <div className="my-2 h-px bg-border/80" />
              )}
              {olderWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  isSelected={selectedWorkspaces.has(workspace.id)}
                  isActive={activeWorkspaceId === workspace.id}
                  manageMode={manageMode}
                  onSelect={() => openWorkspaceSession(workspace)}
                  onOpenDetails={(workspaceId) => onSelectWorkspace(workspaceId)}
                  onToggleSelection={(selected) => {
                    toggleWorkspaceSelection(workspace.id, selected)
                  }}
                  onDelete={(e) => handleDelete(workspace.id, e)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <DeleteWorkspaceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDeleting={deleteWorkspace.isPending}
        workspaceCount={Array.isArray(workspaceToDelete) ? workspaceToDelete.length : 1}
      />
    </div>
  )
}
