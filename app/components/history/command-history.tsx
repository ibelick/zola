"use client"

import { useChatSession } from "@/app/providers/chat-session-provider"
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
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Chats } from "@/lib/chat-store/types"
import { cn } from "@/lib/utils"
import { Check, PencilSimple, TrashSimple, X } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { formatDate, groupChatsByDate } from "./utils"

type CommandHistoryProps = {
  chatHistory: Chats[]
  onSaveEdit: (id: string, newTitle: string) => Promise<void>
  onConfirmDelete: (id: string) => Promise<void>
  trigger: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
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

      {/* Date and actions container */}
      <div className="relative flex min-w-[120px] flex-shrink-0 justify-end">
        {/* Date that shows by default but hides on selection */}
        <span
          className={cn(
            "text-muted-foreground text-sm font-normal opacity-100 transition-opacity duration-0",
            "group-data-[selected=true]:opacity-0",
            Boolean(editingId || deletingId) &&
              "group-data-[selected=true]:opacity-100"
          )}
        >
          {formatDate(chat?.created_at)}
        </span>

        {/* Action buttons that appear on selection, positioned over the date */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-end gap-1 opacity-0 transition-opacity duration-0",
            "group-data-[selected=true]:opacity-100",
            Boolean(editingId || deletingId) &&
              "group-data-[selected=true]:opacity-0"
          )}
        >
          <Tooltip>
            <Button
              size="icon"
              variant="ghost"
              className="group/edit hover:bg-primary/10 size-8 transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation()
                if (chat) onEdit(chat)
              }}
              type="button"
              aria-label="Edit"
            >
              <PencilSimple className="text-muted-foreground group-hover/edit:text-primary size-4 transition-colors duration-150" />
            </Button>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <Button
              size="icon"
              variant="ghost"
              className="group/delete text-muted-foreground hover:text-destructive hover:bg-destructive-foreground/10 size-8 transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation()
                if (chat?.id) onDelete(chat.id)
              }}
              type="button"
              aria-label="Delete"
            >
              <TrashSimple className="text-muted-foreground group-hover/delete:text-destructive size-4 transition-colors duration-150" />
            </Button>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  )
}

export function CommandHistory({
  chatHistory,
  onSaveEdit,
  onConfirmDelete,
  trigger,
  isOpen,
  setIsOpen,
  hasPopover = true,
}: CommandHistoryProps) {
  const { chatId } = useChatSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearchQuery("")
      setEditingId(null)
      setEditTitle("")
      setDeletingId(null)
    }
  }

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

  // Group chats by time periods
  const groupedChats = useMemo(
    () => groupChatsByDate(chatHistory, searchQuery),
    [chatHistory, searchQuery]
  )

  const renderChatItem = useCallback(
    (chat: Chats) => {
      const isCurrentChatSession = chat.id === chatId
      const isCurrentChatEditOrDelete =
        chat.id === editingId || chat.id === deletingId
      const isEditOrDeleteMode = editingId || deletingId

      return (
        <CommandItem
          key={chat.id}
          onSelect={() => {
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
              "data-[selected=true]:bg-transparent"
          )}
          value={chat.id}
          data-value-id={chat.id}
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
      editingId,
      deletingId,
      editTitle,
      handleSaveEdit,
      handleCancelEdit,
      handleConfirmDelete,
      handleCancelDelete,
      handleEdit,
      handleDelete,
    ]
  )

  // Prefetch chat pages, later we will do pagination + infinite scroll
  useEffect(() => {
    if (!isOpen) return

    // Simply prefetch all the chat routes when dialog opens
    chatHistory.forEach((chat) => {
      router.prefetch(`/c/${chat.id}`)
    })
  }, [isOpen, chatHistory, router])

  // Add keyboard shortcut to open dialog with Command+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [isOpen, setIsOpen])

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
      <CommandDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title="Chat History"
        description="Search through your past conversations"
      >
        <Command shouldFilter={false} className="border-none">
          <CommandInput
            placeholder="Search history..."
            value={searchQuery}
            onValueChange={(value) => setSearchQuery(value)}
          />
          <CommandList className="max-h-[480px] min-h-[480px] flex-1 [&>[cmdk-list-sizer]]:space-y-6 [&>[cmdk-list-sizer]]:py-2">
            {filteredChat.length === 0 && (
              <CommandEmpty>No chat history found.</CommandEmpty>
            )}

            {searchQuery ? (
              // When searching, display a flat list without grouping
              <CommandGroup className="p-1.5">
                {filteredChat.map((chat) => renderChatItem(chat))}
              </CommandGroup>
            ) : (
              // When not searching, display grouped by date
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

          {/* indicator command bar */}
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
        </Command>
      </CommandDialog>
    </>
  )
}
