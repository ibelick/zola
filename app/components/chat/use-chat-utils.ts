import { toast } from "@/components/ui/toast"
import { checkRateLimits } from "@/lib/api"
import { REMAINING_QUERY_ALERT_THRESHOLD } from "@/lib/config"
import { Message } from "@ai-sdk/react"

type UseChatUtilsProps = {
  isAuthenticated: boolean
  chatId: string | null
  messages: Message[]
  input: string
  selectedModel: string
  systemPrompt: string
  selectedAgentId: string | null
  createNewChat: (
    userId: string,
    title?: string,
    model?: string,
    isAuthenticated?: boolean,
    systemPrompt?: string,
    agentId?: string
  ) => Promise<any>
  setHasDialogAuth: (value: boolean) => void
}

export function useChatUtils({
  isAuthenticated,
  chatId,
  messages,
  input,
  selectedModel,
  systemPrompt,
  selectedAgentId,
  createNewChat,
  setHasDialogAuth,
}: UseChatUtilsProps) {
  const checkLimitsAndNotify = async (uid: string): Promise<boolean> => {
    try {
      const rateData = await checkRateLimits(uid, isAuthenticated)

      if (rateData.remaining === 0 && !isAuthenticated) {
        setHasDialogAuth(true)
        return false
      }

      if (rateData.remaining === REMAINING_QUERY_ALERT_THRESHOLD) {
        toast({
          title: `Only ${rateData.remaining} quer${
            rateData.remaining === 1 ? "y" : "ies"
          } remaining today.`,
          status: "info",
        })
      }

      if (rateData.remainingPro === REMAINING_QUERY_ALERT_THRESHOLD) {
        toast({
          title: `Only ${rateData.remainingPro} pro quer${
            rateData.remainingPro === 1 ? "y" : "ies"
          } remaining today.`,
          status: "info",
        })
      }

      return true
    } catch (err) {
      console.error("Rate limit check failed:", err)
      return false
    }
  }

  const ensureChatExists = async (userId: string) => {
    if (!isAuthenticated) {
      const storedGuestChatId = localStorage.getItem("guestChatId")
      if (storedGuestChatId) return storedGuestChatId
    }

    if (messages.length === 0) {
      try {
        const newChat = await createNewChat(
          userId,
          input,
          selectedModel,
          isAuthenticated,
          selectedAgentId ? undefined : systemPrompt, // if agentId is set, systemPrompt is not used
          selectedAgentId || undefined
        )

        if (!newChat) return null
        if (isAuthenticated) {
          window.history.pushState(null, "", `/c/${newChat.id}`)
        } else {
          localStorage.setItem("guestChatId", newChat.id)
        }

        return newChat.id
      } catch (err: any) {
        let errorMessage = "Something went wrong."
        try {
          const parsed = JSON.parse(err.message)
          errorMessage = parsed.error || errorMessage
        } catch {
          errorMessage = err.message || errorMessage
        }
        toast({
          title: errorMessage,
          status: "error",
        })
        return null
      }
    }

    return chatId
  }

  return {
    checkLimitsAndNotify,
    ensureChatExists,
  }
}
