import { toast } from "@/components/ui/toast"
import { Chats } from "@/lib/chat-store/types"
import { MODEL_DEFAULT } from "@/lib/config"
import type { UserProfile } from "@/lib/user/types"
import { useCallback, useState } from "react"

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
  // Calculate the effective model based on priority: chat model > first favorite model > default
  const getEffectiveModel = useCallback(() => {
    const firstFavoriteModel = user?.favorite_models?.[0]
    return currentChat?.model || firstFavoriteModel || MODEL_DEFAULT
  }, [currentChat?.model, user?.favorite_models])

  // Use local state only for temporary overrides, derive base value from props
  const [localSelectedModel, setLocalSelectedModel] = useState<string | null>(
    null
  )

  // The actual selected model: local override or computed effective model
  const selectedModel = localSelectedModel || getEffectiveModel()

  // Function to handle model changes with proper validation and error handling
  const handleModelChange = useCallback(
    async (newModel: string) => {
      // For authenticated users without a chat, we can't persist yet
      // but we still allow the model selection for when they create a chat
      if (!user?.id && !chatId) {
        // For unauthenticated users without chat, just update local state
        setLocalSelectedModel(newModel)
        return
      }

      // For authenticated users with a chat, persist the change
      if (chatId && updateChatModel && user?.id) {
        // Optimistically update the state
        setLocalSelectedModel(newModel)

        try {
          await updateChatModel(chatId, newModel)
          // Clear local override since it's now persisted in the chat
          setLocalSelectedModel(null)
        } catch (err) {
          // Revert on error
          setLocalSelectedModel(null)
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
        setLocalSelectedModel(newModel)
      }
    },
    [chatId, updateChatModel, user?.id]
  )

  return {
    selectedModel,
    handleModelChange,
  }
}
