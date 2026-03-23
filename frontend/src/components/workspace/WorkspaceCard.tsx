import { useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSwipe } from '@/hooks/useSwipe'
import type { SessionDetail } from '@opencode-manager/shared'

interface WorkspaceCardProps {
  workspace: SessionDetail
  isSelected: boolean
  isActive: boolean
  manageMode: boolean
  onSelect: (workspaceId: string) => void
  onOpenDetails: (workspaceId: string) => void
  onToggleSelection: (selected: boolean) => void
  onDelete: (e: React.MouseEvent<HTMLButtonElement>) => void
}

const getStatusVariant = (status: string | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline'
  const normalized = status.toLowerCase()
  if (normalized === 'running') return 'secondary'
  if (normalized === 'error') return 'destructive'
  if (normalized === 'stopped') return 'outline'
  return 'outline'
}

const getStatusLabel = (status: string | undefined): string => {
  if (!status) return 'Unknown'
  const normalized = status.toLowerCase()
  if (normalized === 'stopped') return 'Inactive'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function WorkspaceCard({
  workspace,
  isSelected,
  isActive,
  manageMode,
  onSelect,
  onOpenDetails,
  onToggleSelection,
  onDelete,
}: WorkspaceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { bind, swipeOffset, isOpen, isSwipingBack, close, swipeStyles } = useSwipe()

  useEffect(() => {
    if (cardRef.current) {
      return bind(cardRef.current)
    }
  }, [bind])

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    onDelete(e)
    close()
  }

  const updatedAt = workspace.lastActiveAt ? new Date(workspace.lastActiveAt) : new Date()

  return (
    <div className="relative" onClick={close}>
      <div
        className={`absolute top-0.5 right-0 bottom-0.5 w-20 bg-red-600 flex items-center justify-center rounded-r-lg transition-opacity ${
          !isSwipingBack && (isOpen || swipeOffset > 40) ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          className="h-full w-full flex items-center justify-center text-white hover:bg-red-700"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <div ref={cardRef} style={swipeStyles}>
        <Card
          className={`p-2 cursor-pointer transition-all overflow-hidden ${
            isOpen ? 'rounded-none' : 'rounded-r-lg'
          } ${
            isSelected
              ? 'border-blue-500 shadow-lg shadow-blue-900/30 dark:shadow-blue-900/30 bg-accent'
              : isActive
                ? 'bg-accent border-border'
                : 'bg-card border-border hover:bg-accent hover:border-border'
          } hover:shadow-lg`}
          onClick={() => {
            if (!isOpen) {
              onSelect(workspace.id)
            }
          }}
        >
          <div className="flex items-start justify-between gap-2">
            {manageMode ? (
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      onToggleSelection(checked === true)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    className="w-5 h-5 flex-shrink-0"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="text-base font-semibold text-orange-600 dark:text-orange-400 truncate">
                      {workspace.name}
                    </h3>
                    <Badge className="text-[10px] px-1.5 py-0" variant={getStatusVariant(workspace.status)}>
                      {getStatusLabel(workspace.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 truncate">
                      {workspace.name}
                    </h3>
                    <Badge className="text-[10px] px-1.5 py-0" variant={getStatusVariant(workspace.status)}>
                      {getStatusLabel(workspace.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <button
                  className="h-7 w-7 p-0 text-foreground hover:text-blue-600 dark:hover:text-blue-400 bg-transparent border-none cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDetails(workspace.id)
                  }}
                  title="Workspace details"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            )}
            {manageMode && (
              <button
                className="h-6 w-6 p-0 text-foreground hover:text-red-600 dark:hover:text-red-400 bg-transparent border-none cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(e)
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
