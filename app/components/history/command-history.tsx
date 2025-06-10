"use client"

import { useKeyShortcut } from "@/app/hooks/use-key-shortcut"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useChatSession } from "@/lib/chat-store/session/provider"
import type { Chats } from "@/lib/chat-store/types"
import { useChatPreview } from "@/lib/hooks/use-chat-preview"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { cn } from "@/lib/utils"
import { Check, PencilSimple, TrashSimple, X } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useRef, useState } from "react"
import { ChatPreviewPanel } from "./chat-preview-panel"
import { formatDate, groupChatsByDate } from "./utils"

type CommandHistoryProps = {
  chatHistory: Chats[]
  onSaveEdit: (id: string, newTitle: string) => Promise<void>
  onConfirmDelete: (id: string) => Promise<void>
  trigger: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onOpenChange?: (open: boolean) => void
  onHandleOpenChangeRef?: React.MutableRefObject<
    ((open: boolean) => void) | null
  >
  hasPopover?: boolean
}

type CommandItemEditProps = {
  chat: Chats
  editTitle: string
  setEditTitle: (title: string) => void
  onSave: (id: string) => void
  onCancel: () => void
}

type CommandItemDeleteProps = {
  chat: Chats
  onConfirm: (id: string) => void
  onCancel: () => void
}

type CommandItemRowProps = {
  chat: Chats
  onEdit: (chat: Chats) => void
  onDelete: (id: string) => void
  editingId: string | null
  deletingId: string | null
}

// Component for editing a chat item
function CommandItemEdit({
  chat,
  editTitle,
  setEditTitle,
  onSave,
  onCancel,
}: CommandItemEditProps) {
  return (
    <form
      className="flex w-full items-center justify-between"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(chat.id)
      }}
    >
      <Input
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        className="border-input h-8 flex-1 rounded border bg-transparent px-3 py-1 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onSave(chat.id)
          }
        }}
      />
      <div className="ml-2 flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/edit-confirm text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              type="submit"
              aria-label="Confirm"
            >
              <Check className="group-hover/edit-confirm:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/edit-cancel text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              type="button"
              onClick={onCancel}
              aria-label="Cancel"
            >
              <X className="group-hover/edit-cancel:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  )
}

// Component for deleting a chat item
function CommandItemDelete({
  chat,
  onConfirm,
  onCancel,
}: CommandItemDeleteProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onConfirm(chat.id)
      }}
      className="flex w-full items-center justify-between"
    >
      <div className="flex flex-1 items-center">
        <span className="line-clamp-1 text-base font-normal">{chat.title}</span>
        <input
          type="text"
          className="sr-only hidden"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              onCancel()
            } else if (e.key === "Enter") {
              e.preventDefault()
              onConfirm(chat.id)
            }
          }}
        />
      </div>
      <div className="ml-2 flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/delete-confirm text-muted-foreground hover:text-destructive-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              type="submit"
              aria-label="Confirm"
            >
              <Check className="group-hover/delete-confirm:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/delete-cancel text-muted-foreground hover:text-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              onClick={onCancel}
              type="button"
              aria-label="Cancel"
            >
              <X className="group-hover/delete-cancel:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  )
}

// Component for displaying a normal chat row
function CommandItemRow({
  chat,
  onEdit,
  onDelete,
  editingId,
  deletingId,
}: CommandItemRowProps) {
  const { chatId } = useChatSession()
  const isCurrentChat = chat.id === chatId

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="line-clamp-1 text-base font-normal">
          {chat?.title || "Untitled Chat"}
        </span>
        {isCurrentChat && <Badge variant="outline">current</Badge>}
      </div>

      <div className="relative flex min-w-[140px] flex-shrink-0 items-center justify-end">
        <div className="text-muted-foreground mr-2 text-xs transition-opacity duration-200 group-hover:opacity-0">
          {formatDate(chat.created_at)}
        </div>

        <div className="absolute right-0 flex translate-x-1 gap-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="group/edit text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(chat)
                }}
                disabled={!!editingId || !!deletingId}
                aria-label="Edit"
              >
                <PencilSimple className="group-hover/edit:text-primary size-4 transition-colors duration-150" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="group/delete text-muted-foreground hover:text-destructive-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(chat.id)
                }}
                disabled={!!editingId || !!deletingId}
                aria-label="Delete"
              >
                <TrashSimple className="group-hover/delete:text-primary size-4 transition-colors duration-150" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  )
}

type CustomCommandDialogProps = React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  onOpenChange?: (open: boolean) => void
}

// Custom CommandDialog with className support
function CustomCommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  onOpenChange,
  open,
  ...props
}: CustomCommandDialogProps) {
  return (
    <Dialog {...props} onOpenChange={onOpenChange} open={open}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("overflow-hidden border-none p-0", className)}
      >
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground border-none **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 [&_[cmdk-item]_svg]:border-none">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function CommandHistory({
  chatHistory,
  onSaveEdit,
  onConfirmDelete,
  trigger,
  isOpen,
  setIsOpen,
  onOpenChange,
  onHandleOpenChangeRef,
  hasPopover = true,
}: CommandHistoryProps) {
  const { chatId } = useChatSession()
  const router = useRouter()
  const { preferences } = useUserPreferences()
  const hasPrefetchedRef = useRef(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const [isPreviewPanelHovered, setIsPreviewPanelHovered] = useState(false)
  const { messages, isLoading, error, fetchPreview, clearPreview } =
    useChatPreview()

  if (isOpen && !hasPrefetchedRef.current) {
    const recentChats = chatHistory.slice(0, 10)
    recentChats.forEach((chat) => {
      router.prefetch(`/c/${chat.id}`)
    })
    hasPrefetchedRef.current = true
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)

    if (!open) {
      setSearchQuery("")
      setEditingId(null)
      setEditTitle("")
      setDeletingId(null)
      setSelectedChatId(null)
      setHoveredChatId(null)
      setIsPreviewPanelHovered(false)
      clearPreview()
      hasPrefetchedRef.current = false
    }
  }

  useKeyShortcut(
    (e: KeyboardEvent) => e.key === "k" && (e.metaKey || e.ctrlKey),
    () => handleOpenChange(!isOpen)
  )

  const handleChatHover = useCallback(
    (chatId: string | null) => {
      if (!preferences.showConversationPreviews) return

      setHoveredChatId(chatId)

      // Fetch preview when hovering over a chat
      if (chatId) {
        fetchPreview(chatId)
      }
    },
    [preferences.showConversationPreviews, fetchPreview]
  )

  const handlePreviewHover = useCallback(
    (isHovering: boolean) => {
      if (!preferences.showConversationPreviews) return

      setIsPreviewPanelHovered(isHovering)

      // Only clear the hovered chat if we're not hovering the preview panel
      // and there are already loaded messages
      if (!isHovering && !hoveredChatId) {
        setHoveredChatId(null)
      }
    },
    [preferences.showConversationPreviews, hoveredChatId]
  )

  const handleEdit = useCallback((chat: Chats) => {
    setEditingId(chat.id)
    setEditTitle(chat.title || "")
  }, [])

  const handleSaveEdit = useCallback(
    async (id: string) => {
      setEditingId(null)
      await onSaveEdit(id, editTitle)
    },
    [editTitle, onSaveEdit]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditTitle("")
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
  }, [])

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      setDeletingId(null)
      await onConfirmDelete(id)
    },
    [onConfirmDelete]
  )

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null)
  }, [])

  const filteredChat = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return query
      ? chatHistory.filter((chat) =>
          (chat.title || "").toLowerCase().includes(query)
        )
      : chatHistory
  }, [chatHistory, searchQuery])

  const groupedChats = useMemo(
    () => groupChatsByDate(chatHistory, searchQuery),
    [chatHistory, searchQuery]
  )

  const activePreviewChatId =
    hoveredChatId || (isPreviewPanelHovered ? hoveredChatId : null)

  const renderChatItem = useCallback(
    (chat: Chats) => {
      const isCurrentChatSession = chat.id === chatId
      const isCurrentChatEditOrDelete =
        chat.id === editingId || chat.id === deletingId
      const isEditOrDeleteMode = editingId || deletingId
      const isSelected = chat.id === selectedChatId

      return (
        <CommandItem
          key={chat.id}
          onSelect={() => {
            if (preferences.showConversationPreviews) {
              setSelectedChatId(chat.id)
            }

            if (isCurrentChatSession) {
              setIsOpen(false)
              return
            }
            if (!editingId && !deletingId) {
              router.push(`/c/${chat.id}`)
            }
          }}
          className={cn(
            "group group data-[selected=true]:bg-accent flex w-full items-center justify-between rounded-md",
            isCurrentChatEditOrDelete ? "!py-2" : "py-2",
            isCurrentChatEditOrDelete &&
              "bg-accent data-[selected=true]:bg-accent",
            !isCurrentChatEditOrDelete &&
              isEditOrDeleteMode &&
              "data-[selected=true]:bg-transparent",
            isSelected && preferences.showConversationPreviews && "bg-accent/50"
          )}
          value={chat.id}
          onMouseEnter={() => handleChatHover(chat.id)}
        >
          {editingId === chat.id ? (
            <CommandItemEdit
              chat={chat}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          ) : deletingId === chat.id ? (
            <CommandItemDelete
              chat={chat}
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
            />
          ) : (
            <CommandItemRow
              chat={chat}
              onEdit={handleEdit}
              onDelete={handleDelete}
              editingId={editingId}
              deletingId={deletingId}
            />
          )}
        </CommandItem>
      )
    },
    [
      chatId,
      router,
      setIsOpen,
      editingId,
      deletingId,
      editTitle,
      selectedChatId,
      preferences.showConversationPreviews,
      isPreviewPanelHovered,
      handleSaveEdit,
      handleCancelEdit,
      handleConfirmDelete,
      handleCancelDelete,
      handleEdit,
      handleDelete,
      handleChatHover,
    ]
  )

  return (
    <>
      {hasPopover ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>History ⌘+K</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <CustomCommandDialog
        onOpenChange={handleOpenChange}
        open={isOpen}
        title="Chat History"
        description="Search through your past conversations"
        className={cn(
          preferences.showConversationPreviews
            ? "sm:max-w-[900px]"
            : "sm:max-w-3xl"
        )}
      >
        <CommandInput
          placeholder="Search history..."
          value={searchQuery}
          onValueChange={(value) => setSearchQuery(value)}
        />

        <div className="flex">
          <div
            className={cn(
              "flex-1",
              preferences.showConversationPreviews ? "max-w-[700px]" : ""
            )}
          >
            <CommandList className="max-h-[480px] min-h-[480px] flex-1 [&>[cmdk-list-sizer]]:space-y-6 [&>[cmdk-list-sizer]]:py-2">
              {filteredChat.length === 0 && (
                <CommandEmpty>No chat history found.</CommandEmpty>
              )}

              {searchQuery ? (
                <CommandGroup className="p-1.5">
                  {filteredChat.map((chat) => renderChatItem(chat))}
                </CommandGroup>
              ) : (
                groupedChats?.map((group) => (
                  <CommandGroup
                    key={group.name}
                    heading={group.name}
                    className="space-y-0 px-1.5"
                  >
                    {group.chats.map((chat) => renderChatItem(chat))}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </div>

          {preferences.showConversationPreviews && (
            <ChatPreviewPanel
              chatId={activePreviewChatId}
              onHover={handlePreviewHover}
              messages={messages}
              isLoading={isLoading}
              error={error}
              onFetchPreview={fetchPreview}
            />
          )}
        </div>

        <div className="bg-card border-input right-0 bottom-0 left-0 flex items-center justify-between border-t px-4 py-3">
          <div className="text-muted-foreground flex w-full items-center gap-2 text-xs">
            <div className="flex w-full flex-row items-center justify-between gap-1">
              <div className="flex w-full flex-1 flex-row items-center gap-4">
                <div className="flex flex-row items-center gap-1.5">
                  <div className="flex flex-row items-center gap-0.5">
                    <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
                      ↑
                    </span>
                    <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
                      ↓
                    </span>
                  </div>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
                    ⏎
                  </span>
                  <span>Go to chat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-row items-center gap-0.5">
                    <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
                      ⌘
                    </span>
                    <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
                      K
                    </span>
                  </div>
                  <span>Toggle</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="border-border bg-muted inline-flex h-5 items-center justify-center rounded-sm border px-1">
                Esc
              </span>
              <span>Close</span>
            </div>
          </div>
        </div>
      </CustomCommandDialog>
    </>
  )
}
