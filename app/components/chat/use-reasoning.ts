import { useChat } from "@ai-sdk/react"

export function useReasoning() {
  const {
    input: reasoningInput,
    messages: reasoningMessages,
    append: appendReasoning,
    setMessages: setReasoningMessages,
    status: reasoningStatus,
  } = useChat({
    api: "/api/agents/reasoning",
  })

  return {
    reasoningInput,
    reasoningMessages,
    appendReasoning,
    setReasoningMessages,
    reasoningStatus,
  }
}
