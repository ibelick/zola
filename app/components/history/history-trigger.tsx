"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useChatSession } from "@/app/providers/chat-session-provider"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { ListMagnifyingGlass } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CommandHistory } from "./command-history"
import { DrawerHistory } from "./drawer-history"

export function HistoryTrigger() {
  const isMobile = useBreakpoint(768)
  const router = useRouter()
  const { chats, updateTitle, deleteChat } = useChats()
  const { deleteMessages } = useMessages()
  const [isOpen, setIsOpen] = useState(false)
  const { chatId } = useChatSession()

  const handleSaveEdit = async (id: string, newTitle: string) => {
    await updateTitle(id, newTitle)
  }

  const handleConfirmDelete = async (id: string) => {
    if (id === chatId) {
      setIsOpen(false)
    }
    await deleteMessages()
    await deleteChat(id, chatId ?? undefined, () => router.push("/")) // Use nullish coalescing for chatId
  }

  const trigger = (
    <button
      className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1.5 transition-colors"
      type="button"
      onClick={() => setIsOpen(true)}
    >
      <ListMagnifyingGlass size={24} />
    </button>
  )

  if (isMobile) {
    return (
      <DrawerHistory
        chatHistory={chats}
        onSaveEdit={handleSaveEdit}
        onConfirmDelete={handleConfirmDelete}
        trigger={trigger}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    )
  }

  // Conditionally render CommandHistory based on isOpen state for desktop
  return (
    <>
      {trigger} {/* Render the trigger button */}
      {isOpen && !isMobile && ( // Only render when open and not mobile
        <CommandHistory
          chatHistory={chats}
          onClose={() => setIsOpen(false)} // Pass the close handler
          onSaveEdit={handleSaveEdit} // Pass edit handler
          onConfirmDelete={handleConfirmDelete} // Pass delete handler
        />
      )}
    </>
  )
}
