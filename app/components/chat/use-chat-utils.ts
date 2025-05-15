import { toast } from "@/components/ui/toast"
import { checkRateLimits } from "@/lib/api"
import { REMAINING_QUERY_ALERT_THRESHOLD } from "@/lib/config"
import { Message } from "@ai-sdk/react"
import { API_ROUTE_CHAT, API_ROUTE_CREATE_CHAT, API_ROUTE_GENERATE_TITLE } from "@/lib/routes"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
// import { v4 as uuidv4 } from 'uuid' // Removed unused import

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
          title: `Only ${rateData.remaining} query${
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

  const ensureChatExists = async (userIdFromAuth: string) => {
    if (!isAuthenticated) {
      const storedGuestChatId = localStorage.getItem("guestChatId")
      if (storedGuestChatId) return storedGuestChatId
    }

    if (messages.length === 0) {
      let titleForChatCreation = input

      if (!selectedAgentId) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            "No currentChatId and no selectedAgentId, attempting to generate title first."
          );
        }
        // Attempt to generate a title from the AI based on the first message for new, non-agent chats
        try {
          const titleGenPayload = {
            userMessage: input, // The user's first message
            modelId: selectedModel, // The currently selected model
            // No systemPrompt here as the /api/generate-title has its own specific system prompt
          };

          const res = await fetch(API_ROUTE_GENERATE_TITLE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(titleGenPayload),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.title && typeof data.title === 'string' && data.title.trim().length > 0) {
              titleForChatCreation = data.title.trim();
              if (process.env.NODE_ENV === 'development') {
                console.log("AI Generated Title (from new endpoint):", titleForChatCreation);
              }
            } else {
              console.warn("/api/generate-title returned no title or empty title, using input.");
            }
          } else {
            console.error(
              "Error generating title via /api/generate-title:",
              res.status,
              await res.text()
            );
            // Fallback to user input if title generation fails
          }
        } catch (error) {
          console.error("Exception during title generation call:", error);
          // Fallback to user input if title generation fails
        }
      }

      try {
        const newChat = await createNewChat(
          userIdFromAuth,
          titleForChatCreation,
          selectedModel,
          isAuthenticated,
          selectedAgentId ? undefined : systemPrompt,
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
