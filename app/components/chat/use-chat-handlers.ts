import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { UserProfile } from "@/app/types/user"
import { toast } from "@/components/ui/toast"
import { useCallback } from "react"
import type { UIMessageFull } from "./chat"

type UseChatHandlersProps = {
  messages: UIMessageFull[]
  setMessages: (
    messages: UIMessageFull[] | ((messages: UIMessageFull[]) => UIMessageFull[])
  ) => void
  setInput: (input: string) => void
  chatId: string | null
}

export function useChatHandlers({
  messages,
  setMessages,
  setInput,
  chatId,
}: UseChatHandlersProps) {
  const { setDraftValue } = useChatDraft(chatId)

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setDraftValue(value)
    },
    [setInput, setDraftValue]
  )

  const handleDelete = useCallback(
    (id: string) => {
      setMessages(messages.filter((message) => message.id !== id))
    },
    [messages, setMessages]
  )

  const handleEdit = useCallback(
    (id: string, newText: string) => {
      setMessages(
        messages.map((message) =>
          message.id === id ? { ...message, content: newText } : message
        )
      )
    },
    [messages, setMessages]
  )

  return {
    handleInputChange,
    handleDelete,
    handleEdit,
  }
}
