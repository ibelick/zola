import { UserProfile } from "@/app/types/user"
import { toast } from "@/components/ui/toast"
import { Chats } from "@/lib/chat-store/types"
import { MODEL_DEFAULT } from "@/lib/config"
import { useCallback, useEffect, useState } from "react"

interface UseModelProps {
  currentChat: Chats | null
  user: UserProfile | null
  updateChatModel?: (chatId: string, model: string) => Promise<void>
  chatId: string | null
}

/**
 * Hook to manage the current selected model with proper fallback logic
 * Handles both cases: with existing chat (persists to DB) and without chat (local state only)
 * @param currentChat - The current chat object
 * @param user - The current user object
 * @param updateChatModel - Function to update chat model in the database
 * @param chatId - The current chat ID
 * @returns Object containing selected model and handler function
 */
export function useModel({
  currentChat,
  user,
  updateChatModel,
  chatId,
}: UseModelProps) {
  // Calculate the effective model based on priority: chat model > user preferred > default
  const getEffectiveModel = useCallback(() => {
    return currentChat?.model || user?.preferred_model || MODEL_DEFAULT
  }, [currentChat?.model, user?.preferred_model])

  const [selectedModel, setSelectedModel] = useState<string>(getEffectiveModel)

  // Update selectedModel when dependencies change
  useEffect(() => {
    setSelectedModel(getEffectiveModel())
  }, [getEffectiveModel])

  // Function to handle model changes with proper validation and error handling
  const handleModelChange = useCallback(
    async (newModel: string) => {
      // For authenticated users without a chat, we can't persist yet
      // but we still allow the model selection for when they create a chat
      if (!user?.id && !chatId) {
        // For unauthenticated users without chat, just update local state
        setSelectedModel(newModel)
        return
      }

      // For authenticated users with a chat, persist the change
      if (chatId && updateChatModel && user?.id) {
        // Optimistically update the state
        setSelectedModel(newModel)

        try {
          await updateChatModel(chatId, newModel)
        } catch (err) {
          // Revert on error
          setSelectedModel(getEffectiveModel())
          console.error("Failed to update chat model:", err)
          toast({
            title: "Failed to update chat model",
            status: "error",
          })
          throw err
        }
      } else if (user?.id) {
        // Authenticated user but no chat yet - just update local state
        // The model will be used when creating a new chat
        setSelectedModel(newModel)
      }
    },
    [chatId, updateChatModel, user?.id, getEffectiveModel]
  )

  return {
    selectedModel,
    handleModelChange,
  }
}
