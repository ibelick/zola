import { toast } from "@/components/ui/toast"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { API_ROUTE_CHAT } from "@/lib/routes"
import { useChat } from "@ai-sdk/react"
import type { Message } from "@ai-sdk/react"
import { useCallback, useMemo, useRef } from "react"

type UseChatInitializationProps = {
  initialMessages: Message[]
  draftValue: string
  cacheAndAddMessage: (message: Message) => void
  chatId: string | null
  user: any
}

export function useChatInitialization({
  initialMessages,
  draftValue,
  cacheAndAddMessage,
  chatId,
  user,
}: UseChatInitializationProps) {
  const hasSentFirstMessageRef = useRef(false)
  const prevChatIdRef = useRef<string | null>(chatId)
  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])

  // Handle errors directly in onError callback
  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error)
    console.error("Error message:", error.message)
    // The server now properly forwards error messages via getErrorMessage
    // So we can use the error message directly
    let errorMsg = error.message || "Something went wrong."

    // If the error message is still generic, provide a fallback
    if (errorMsg === "An error occurred" || errorMsg === "fetch failed") {
      errorMsg = "Something went wrong. Please try again."
    }

    toast({
      title: errorMsg,
      status: "error",
    })
  }, [])

  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  const {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
  } = useChat({
    api: API_ROUTE_CHAT,
    initialMessages,
    initialInput: draftValue,
    onFinish: cacheAndAddMessage,
    onError: handleError,
  })

  // Reset messages when navigating from a chat to home (not on every render)
  if (
    prevChatIdRef.current !== null &&
    chatId === null &&
    messages.length > 0
  ) {
    setMessages([])
  }
  prevChatIdRef.current = chatId

  return {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
    isAuthenticated,
    systemPrompt,
    hasSentFirstMessageRef,
  }
}
