import { Message as MessageAISDK } from "ai"

/**
 * Clean messages when switching between agents with different tool capabilities.
 * This removes tool invocations and tool-related content from messages when tools are not available
 * to prevent OpenAI API errors.
 */
export function cleanMessagesForTools(
  messages: MessageAISDK[],
  hasTools: boolean
): MessageAISDK[] {
  // If tools are available, return messages as-is
  if (hasTools) {
    return messages
  }

  // If no tools available, clean all tool-related content
  const cleanedMessages = messages
    .map((message) => {
      // Skip tool messages entirely when no tools are available
      // Note: Using type assertion since AI SDK types might not include 'tool' role
      if ((message as { role: string }).role === "tool") {
        return null
      }

      // For assistant messages, clean tool invocations and tool calls
      if (message.role === "assistant") {
        const cleanedMessage: MessageAISDK = { ...message }

        // Remove tool invocations if present
        if (message.toolInvocations && message.toolInvocations.length > 0) {
          delete cleanedMessage.toolInvocations
        }

        // Clean content if it's an array (remove tool-call parts)
        if (Array.isArray(message.content)) {
          const filteredContent = (message.content as Array<{ type?: string; text?: string }>).filter(
            (part: { type?: string }) => {
              if (part && typeof part === "object" && part.type) {
                // Remove tool-call, tool-result, and tool-invocation parts
                const isToolPart =
                  part.type === "tool-call" ||
                  part.type === "tool-result" ||
                  part.type === "tool-invocation"
                return !isToolPart
              }
              return true
            }
          )

          // Extract text content
          const textParts = filteredContent.filter(
            (part: { type?: string }) =>
              part && typeof part === "object" && part.type === "text"
          )

          if (textParts.length > 0) {
            // Combine text parts into a single string
            const textContent = textParts
              .map((part: { text?: string }) => part.text || "")
              .join("\n")
              .trim()
            cleanedMessage.content = textContent || "[Assistant response]"
          } else if (filteredContent.length === 0) {
            // If no content remains after filtering, provide fallback
            cleanedMessage.content = "[Assistant response]"
          } else {
            // Keep the filtered content as string if possible
            cleanedMessage.content = "[Assistant response]"
          }
        }

        // If the message has no meaningful content after cleaning, provide fallback
        if (
          !cleanedMessage.content ||
          (typeof cleanedMessage.content === "string" &&
            cleanedMessage.content.trim() === "")
        ) {
          cleanedMessage.content = "[Assistant response]"
        }

        return cleanedMessage
      }

      // For user messages, clean any tool-related content from array content
      if (message.role === "user" && Array.isArray(message.content)) {
        const filteredContent = (message.content as Array<{ type?: string }>).filter(
          (part: { type?: string }) => {
            if (part && typeof part === "object" && part.type) {
              const isToolPart =
                part.type === "tool-call" ||
                part.type === "tool-result" ||
                part.type === "tool-invocation"
              return !isToolPart
            }
            return true
          }
        )

        if (filteredContent.length !== (message.content as Array<unknown>).length) {
          return {
            ...message,
            content:
              filteredContent.length > 0 ? filteredContent : "User message",
          }
        }
      }

      return message
    })
    .filter((message): message is MessageAISDK => message !== null)

  return cleanedMessages
}

/**
 * Check if a message contains tool-related content
 */
export function messageHasToolContent(message: MessageAISDK): boolean {
  return !!(
    message.toolInvocations?.length ||
    (message as { role: string }).role === "tool" ||
    (Array.isArray(message.content) &&
      (message.content as Array<{ type?: string }>).some(
        (part: { type?: string }) =>
          part &&
          typeof part === "object" &&
          part.type &&
          (part.type === "tool-call" ||
            part.type === "tool-result" ||
            part.type === "tool-invocation")
      ))
  )
}
