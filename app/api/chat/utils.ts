import { Message as MessageAISDK } from "ai"

/**
 * Clean messages when switching between agents with different tool capabilities.
 * This removes tool invocations from messages when tools are not available
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

  // If no tools available, remove tool invocations from all messages
  return messages.map((message) => {
    // Remove tool invocations if present
    if (message.toolInvocations && message.toolInvocations.length > 0) {
      const { toolInvocations, ...messageWithoutTools } = message

      // If the message has no meaningful content after removing tools,
      // provide a fallback content
      if (
        !messageWithoutTools.content ||
        (typeof messageWithoutTools.content === "string" &&
          messageWithoutTools.content.trim() === "")
      ) {
        return {
          ...messageWithoutTools,
          content: "[Tool response]",
        }
      }

      return messageWithoutTools
    }

    return message
  })
}

/**
 * Check if a message contains tool-related content
 */
export function messageHasToolContent(message: MessageAISDK): boolean {
  return !!message.toolInvocations?.length
}
