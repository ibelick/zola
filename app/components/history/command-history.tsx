"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Removed Label import as it's no longer used
import { ScrollArea } from "@/components/ui/scroll-area"
// Removed Switch import
import type { Chats } from "@/lib/chat-store/types"
import { cn } from "@/lib/utils"
// Import cache, fetch, AND the explicit cache function
import { getCachedMessages, fetchAndCacheMessages, cacheMessages } from "@/lib/chat-store/messages/api"
import { Check, CircleNotch, MagnifyingGlass, NotePencil, PencilSimple, TrashSimple, X } from "@phosphor-icons/react" // Added CircleNotch
import type { Message as MessageAISDK } from "ai"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatDate, groupChatsByDate } from "./utils"

// Dynamically import Markdown component
const Markdown = dynamic(
  () => import("@/components/prompt-kit/markdown").then((mod) => mod.Markdown),
  { ssr: false }
)

/* ------------------------------------------------------------------
  Hook: useChatMessages (Moved to CommandHistory component)
  ------------------------------------------------------------------*/
// Removed useChatMessages hook definition from here

/* ------------------------------------------------------------------
  Component: ChatPreview (simplified)
  ------------------------------------------------------------------*/

// Updated props for ChatPreview
type ChatPreviewProps = {
  chat: Chats | null
  messages: MessageAISDK[]
  isLoading: boolean
}

const ChatPreview = React.memo<ChatPreviewProps>(({ chat, messages, isLoading }) => {
  // Removed useChatMessages hook call
  const contentRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

  // Auto‑scroll to bottom on new messages
  useEffect(() => {
    // Scroll when loading finishes or messages update
    if (!isLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isLoading]); // Depend on messages and isLoading

  // 1. Handle case where no chat is selected
  if (!chat) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-lg text-muted-foreground">
        Select a conversation to preview
      </div>
    )
  }

  // 2. Handle loading state (uses the same container structure as the "Select..." message)
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        <div className="flex flex-col items-center">
          <CircleNotch size={24} className="mb-2 animate-spin" />
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  // 3. Handle loaded state (with messages or empty)
  const empty = messages.length === 0

  return (
    <ScrollArea className="h-full">
      <div className="p-8 flex flex-col h-full" ref={contentRef}>
        {/* Render Title and Date */}
        <h2 className="mb-2 text-xl font-bold">{chat.title || 'Untitled Chat'}</h2>
        <div className="mb-6 text-xs text-muted-foreground">{formatDate(chat.created_at)}</div>

        {/* Container for messages or empty state */}
        <div className="flex flex-col flex-1 min-h-[100px] space-y-4 overflow-y-auto"> {/* Added overflow-y-auto */}
          {empty ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">No messages found in this chat.</p>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.id} className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      m.role === 'user'
                        ? 'bg-accent rounded-3xl px-5 py-2.5 max-w-[70%]'
                        : 'text-foreground max-w-[75%] px-3 py-2'
                    )}
                  >
                    {typeof m.content === 'string' ? (
                      <Markdown className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-p:last-of-type:mb-0">
                        {m.content}
                      </Markdown>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">[Unsupported message content]</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* Element to scroll to */}
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  )
})
ChatPreview.displayName = 'ChatPreview'

/* ------------------------------------------------------------------
  Component: ChatItem (memo with custom equality)
  ------------------------------------------------------------------*/

type ChatItemProps = {
  chat: Chats
  isSelected: boolean
  isEditing: boolean
  isDeleting: boolean
  editTitle: string
  onSetHovered: (id: string | null) => void
  onEdit: (chat: Chats) => void
  onDelete: (id: string) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
  onLinkClick: (e: React.MouseEvent) => void
  onSetEditTitle: (title: string) => void
}

function areEqual(prev: ChatItemProps, next: ChatItemProps) {
  return (
    prev.chat === next.chat &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    prev.isDeleting === next.isDeleting &&
    prev.editTitle === next.editTitle
  )
}

// Export ChatItem so it can be reused by sidebar/drawer if needed later
export const ChatItem = React.memo<ChatItemProps>(function ChatItem(props) {
  const {
    chat,
    isSelected,
    isEditing,
    isDeleting,
    editTitle,
    onSetHovered,
    onEdit,
    onDelete,
    onSaveEdit,
    onCancelEdit,
    onConfirmDelete,
    onCancelDelete,
    onLinkClick,
    onSetEditTitle
  } = props

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
    if (e.type === 'click') (e as React.MouseEvent).preventDefault()
  }, [])

  const handleSave = useCallback(() => onSaveEdit(chat.id), [chat.id, onSaveEdit])
  const handleConfirmDel = useCallback(() => onConfirmDelete(chat.id), [chat.id, onConfirmDelete])

  const actionBtn = (
    icon: React.ReactNode,
    onClick: () => void,
    title: string,
    extraCN = ''
  ) => (
    <Button
      size="icon"
      variant="ghost"
      className={cn('h-7 w-7', extraCN)}
      type="button"
      title={title}
      onClick={(e) => {
        stopPropagation(e)
        onClick()
      }}
    >
      {icon}
    </Button>
  )

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5',
        (isSelected && !isEditing && !isDeleting) || isEditing || isDeleting ? 'bg-muted' : 'hover:bg-muted'
      )}
      onMouseEnter={() => !isEditing && !isDeleting && onSetHovered(chat.id)}
    >
      <div className="flex min-w-0 flex-1 items-center pr-16">
        {isEditing ? (
          <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
            <Input
              value={editTitle}
              onChange={(e) => onSetEditTitle(e.target.value)}
              className="h-8 w-full border-input bg-transparent px-2 text-sm"
              autoFocus
              onClick={stopPropagation}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </form>
        ) : isDeleting ? (
          <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleConfirmDel() }}>
            <span className="text-sm text-destructive">Delete this chat?</span>
            {/* hidden input keeps auto‑focus */}
            <input type="text" className="sr-only" autoFocus />
          </form>
        ) : (
          <Link
            href={`/c/${chat.id}`}
            onClick={onLinkClick}
            className="flex min-w-0 flex-1 flex-col items-start overflow-hidden"
            prefetch={false}
            aria-label={`Open chat: ${chat.title || 'Untitled Chat'}`}
          >
            <span className="line-clamp-1 text-base font-normal">{chat.title || 'Untitled Chat'}</span>
            <span className="mr-2 text-xs font-normal text-gray-500">{formatDate(chat.created_at)}</span>
          </Link>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 transform items-center gap-1">
        {isEditing ? (
          <>
            {actionBtn(<Check className="size-4" />, handleSave, 'Save')}
            {actionBtn(<X className="size-4" />, onCancelEdit, 'Cancel')}
          </>
        ) : isDeleting ? (
          <>
            {actionBtn(<Check className="size-4" />, handleConfirmDel, 'Confirm Delete', 'text-destructive hover:bg-destructive/10')}
            {actionBtn(<X className="size-4" />, onCancelDelete, 'Cancel')}
          </>
        ) : (
          <div
            className={cn(
              'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
              isSelected && 'opacity-100'
            )}
          >
            {actionBtn(<PencilSimple className="size-4" />, () => onEdit(chat), 'Rename', 'text-muted-foreground hover:text-foreground')}
            {actionBtn(<TrashSimple className="size-4" />, () => onDelete(chat.id), 'Delete', 'text-muted-foreground hover:text-destructive')}
          </div>
        )}
      </div>
    </div>
  )
}, areEqual)
ChatItem.displayName = 'ChatItem'

/* ------------------------------------------------------------------
  Component: LeftPanelHeader (memo)
  ------------------------------------------------------------------*/

type LeftPanelHeaderProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  showCreateNewChat: boolean
  onCreateNewChat: () => void
}

const LeftPanelHeader = React.memo<LeftPanelHeaderProps>(function LeftPanelHeader({
  searchQuery,
  onSearchChange,
  showCreateNewChat,
  onCreateNewChat
}) {
  return (
    <div className="flex flex-col gap-3 border-b p-4 pb-3 pt-4">
      <div className="relative">
        <Input
          placeholder="Search..."
          className="w-full rounded-lg py-1.5 pl-8 text-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <MagnifyingGlass className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-gray-400" />
      </div>

      <div className="pt-2">
        <h3 className="mb-1 px-2 text-sm font-medium text-muted-foreground">Actions</h3>
        <div className="space-y-1">
          {showCreateNewChat && (
            <Button
              variant="ghost"
              className="h-auto w-full justify-start rounded-lg px-2 py-1.5 text-base font-normal hover:bg-muted"
              onClick={onCreateNewChat}
            >
              <NotePencil size={18} className="mr-2" /> Create New Chat
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})
LeftPanelHeader.displayName = 'LeftPanelHeader'

/* ------------------------------------------------------------------
  Hook: useChatMessages (Moved here)
  ------------------------------------------------------------------*/

const MIN_LOADING_TIME_MS = 300;

type LoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

// Now used within CommandHistory
function useChatMessages(chatId: string | null | undefined) { // Accept chatId directly
  const [messages, setMessages] = useState<MessageAISDK[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const statusRef = useRef<Record<string, LoadingStatus>>({})
  const currentIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Reset when chat ID is cleared or undefined
    if (!chatId) {
      setMessages([])
      setIsLoading(false)
      currentIdRef.current = null
      return
    }

    // Prevent duplicate work for the same chat
    if (currentIdRef.current === chatId) return

    currentIdRef.current = chatId

    const load = async () => {
      const start = Date.now()
      statusRef.current[chatId] = 'loading'
      setIsLoading(true)

      try {
        let msgs = await getCachedMessages(chatId)
        if (msgs.length === 0) {
          msgs = await fetchAndCacheMessages(chatId)
          if (msgs.length) {
            cacheMessages(chatId, msgs).catch(() => {})
          }
        }
        statusRef.current[chatId] = 'loaded'
        setMessages(msgs)
      } catch (err) {
        console.error(`useChatMessages: failed to load ${chatId}`, err)
        statusRef.current[chatId] = 'error'
        setMessages([]) // Clear messages on error
      } finally {
        const elapsed = Date.now() - start
        const delay = Math.max(0, MIN_LOADING_TIME_MS - elapsed)
        // Use setTimeout to ensure loading state persists for minimum duration
        setTimeout(() => {
             // Only set loading to false if the current chat ID hasn't changed during the delay
             if (currentIdRef.current === chatId) {
                setIsLoading(false)
             }
        }, delay)
      }
    }

    load()
  // Effect dependency is now just the chatId
  }, [chatId])

  return { messages, isLoading }
}

/* ------------------------------------------------------------------
  Component: CommandHistory (root)
  ------------------------------------------------------------------*/

type CommandHistoryProps = {
  chatHistory: Chats[]
  onClose: () => void
  onSaveEdit: (id: string, newTitle: string) => Promise<void>
  onConfirmDelete: (id: string) => Promise<void>
}

export function CommandHistory({ chatHistory, onClose, onSaveEdit, onConfirmDelete }: CommandHistoryProps) {
  const router = useRouter()
  const params = useParams<{ chatId?: string }>()

  /* ----------------------------- local state ----------------------------- */
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* --------------------------- prefetech routes -------------------------- */
  useEffect(() => {
    chatHistory.forEach((chat) => router.prefetch(`/c/${chat.id}`))
  }, [chatHistory, router])

  /* ------------------------------ memo data ------------------------------ */
  const filteredChat = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return q ? chatHistory.filter((c) => (c.title || 'Untitled Chat').toLowerCase().includes(q)) : chatHistory
  }, [chatHistory, searchQuery])

  const groupedChats = useMemo(() => groupChatsByDate(filteredChat, searchQuery), [filteredChat, searchQuery])

  // Determine the chat to preview (hovered or selected)
  const previewChatId = useMemo(() => hoveredChatId || params.chatId, [hoveredChatId, params.chatId]);
  const previewChat = useMemo(() => {
      return previewChatId ? chatHistory.find((c) => c.id === previewChatId) || null : null
  }, [previewChatId, chatHistory]);

  // Fetch messages for the preview chat using the hook
  const { messages: previewMessages, isLoading: isPreviewLoading } = useChatMessages(previewChatId);

  /* --------------------------- handlers (memo) --------------------------- */
  const handleSearchChange = useCallback((v: string) => setSearchQuery(v), [])
  const handleSetHoveredChatId = useCallback((id: string | null) => setHoveredChatId(id), [])
  const handleSetEditTitle = useCallback((title: string) => setEditTitle(title), [])

  const handleCreateNewChat = useCallback(() => {
    router.push('/')
    onClose()
  }, [router, onClose])

  const handleEdit = useCallback((chat: Chats) => {
    setEditingId(chat.id)
    setEditTitle(chat.title || '')
    setDeletingId(null)
  }, [])

  const handleSaveEdit = useCallback(async (id: string) => {
    setEditingId(null)
    await onSaveEdit(id, editTitle)
  }, [editTitle, onSaveEdit])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditTitle('')
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
    setEditingId(null)
  }, [])

  const handleConfirmDelete = useCallback(async (id: string) => {
    setDeletingId(null)
    await onConfirmDelete(id)
    // If the deleted chat was the active one, navigate away (optional)
    if (params.chatId === id) {
       router.push('/');
    }
  }, [onConfirmDelete, params.chatId, router])

  const handleCancelDelete = useCallback(() => setDeletingId(null), [])
  const handleLinkClick = useCallback(() => onClose(), [onClose])

  /* --------------------------- Handle Escape Key --------------------------- */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
         if (editingId) {
            handleCancelEdit();
         } else if (deletingId) {
            handleCancelDelete();
         } else {
            onClose();
         }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
    // Include dependencies for edit/delete cancellation
  }, [onClose, editingId, deletingId, handleCancelEdit, handleCancelDelete])

  /* ----------------------------- render UI ------------------------------ */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg border bg-background shadow-xl">
        {/* Left Panel */}
        <div className="relative flex h-full w-full max-w-[300px] flex-col border-r bg-background">
          <LeftPanelHeader
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            showCreateNewChat={!!params.chatId}
            onCreateNewChat={handleCreateNewChat}
          />

          {/* Chat list */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="flex flex-col space-y-1 px-2 py-2">
              {searchQuery ? (
                /* Search active */
                filteredChat.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">No matching chats found.</div>
                ) : (
                  filteredChat.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isSelected={previewChatId === chat.id} // Use previewChatId for selection highlight
                      isEditing={editingId === chat.id}
                      isDeleting={deletingId === chat.id}
                      editTitle={editingId === chat.id ? editTitle : ''}
                      onSetHovered={handleSetHoveredChatId}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onConfirmDelete={handleConfirmDelete}
                      onCancelDelete={handleCancelDelete}
                      onLinkClick={handleLinkClick}
                      onSetEditTitle={handleSetEditTitle}
                    />
                  ))
                )
              ) : !groupedChats ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Loading history...</div>
              ) : groupedChats.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No chat history found.</div>
              ) : (
                groupedChats.map((group) => (
                  <div key={group.name} className="space-y-0.5">
                    <h3 className="pl-2 pt-2 text-sm font-medium text-muted-foreground">{group.name}</h3>
                    {group.chats.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isSelected={previewChatId === chat.id} // Use previewChatId for selection highlight
                        isEditing={editingId === chat.id}
                        isDeleting={deletingId === chat.id}
                        editTitle={editingId === chat.id ? editTitle : ''}
                        onSetHovered={handleSetHoveredChatId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onConfirmDelete={handleConfirmDelete}
                        onCancelDelete={handleCancelDelete}
                        onLinkClick={handleLinkClick}
                        onSetEditTitle={handleSetEditTitle}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        <div className="h-full flex-1 border-l bg-muted/60">
          {/* Pass necessary props to ChatPreview */}
          <ChatPreview
             chat={previewChat}
             messages={previewMessages}
             isLoading={isPreviewLoading}
          />
        </div>
      </div>
    </div>
  )
}
