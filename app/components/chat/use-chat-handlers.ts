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
  setSelectedModel: (model: string) => void
  selectedModel: string
  chatId: string | null
  updateChatModel: (chatId: string, model: string) => Promise<void>
  user: UserProfile | null
}

export function useChatHandlers({
  messages,
  setMessages,
  setInput,
  setSelectedModel,
  selectedModel,
  chatId,
  updateChatModel,
  user,
}: UseChatHandlersProps) {
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
    },
    [setInput]
  )

  const handleModelChange = useCallback(
    async (model: string) => {
      if (!user?.id) {
        return
      }

      if (!chatId && user?.id) {
        setSelectedModel(model)
        return
      }

      const oldModel = selectedModel

      setSelectedModel(model)

      try {
        await updateChatModel(chatId!, model)
      } catch (err) {
        console.error("Failed to update chat model:", err)
        setSelectedModel(oldModel)
        toast({
          title: "Failed to update chat model",
          status: "error",
        })
      }
    },
    [chatId, selectedModel, setSelectedModel, updateChatModel, user?.id]
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
    handleModelChange,
    handleDelete,
    handleEdit,
  }
}
