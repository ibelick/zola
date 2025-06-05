import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { UserProfile } from "@/app/types/user"
import { toast } from "@/components/ui/toast"
import { Message } from "@ai-sdk/react"
import { useCallback } from "react"

type UseChatHandlersProps = {
  messages: Message[]
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
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
