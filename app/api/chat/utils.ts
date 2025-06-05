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

      if (message.role === "assistant") {
        const cleanedMessage: MessageAISDK = { ...message }

        if (message.toolInvocations && message.toolInvocations.length > 0) {
          delete cleanedMessage.toolInvocations
        }

        if (Array.isArray(message.content)) {
          const filteredContent = (
            message.content as Array<{ type?: string; text?: string }>
          ).filter((part: { type?: string }) => {
            if (part && typeof part === "object" && part.type) {
              // Remove tool-call, tool-result, and tool-invocation parts
              const isToolPart =
                part.type === "tool-call" ||
                part.type === "tool-result" ||
                part.type === "tool-invocation"
              return !isToolPart
            }
            return true
          })

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
        const filteredContent = (
          message.content as Array<{ type?: string }>
        ).filter((part: { type?: string }) => {
          if (part && typeof part === "object" && part.type) {
            const isToolPart =
              part.type === "tool-call" ||
              part.type === "tool-result" ||
              part.type === "tool-invocation"
            return !isToolPart
          }
          return true
        })

        if (
          filteredContent.length !== (message.content as Array<unknown>).length
        ) {
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

/**
 * Structured error type for API responses
 */
export type ApiError = Error & {
  statusCode: number
  code: string
}

/**
 * Parse and handle stream errors from AI SDK
 * @param err - The error from streamText onError callback
 * @returns Structured error with status code and error code
 */
export function handleStreamError(err: unknown): ApiError {
  console.error("🛑 streamText error:", err)

  // Extract error details from the AI SDK error
  const aiError = (err as { error?: any })?.error

  if (aiError) {
    // Handle specific API errors with proper status codes
    if (aiError.statusCode === 402) {
      // Payment required
      let message = "Insufficient credits or payment required"

      // Try to extract more specific message from response body
      if (aiError.responseBody) {
        try {
          const parsed = JSON.parse(aiError.responseBody)
          message = parsed.error?.message || message
        } catch {
          // Fallback to generic message if parsing fails
        }
      }

      return Object.assign(new Error(message), {
        statusCode: 402,
        code: "PAYMENT_REQUIRED",
      })
    } else if (aiError.statusCode === 401) {
      // Authentication error
      return Object.assign(
        new Error("Invalid API key or authentication failed"),
        {
          statusCode: 401,
          code: "AUTHENTICATION_ERROR",
        }
      )
    } else if (aiError.statusCode === 429) {
      // Rate limit
      return Object.assign(
        new Error("Rate limit exceeded. Please try again later."),
        {
          statusCode: 429,
          code: "RATE_LIMIT_EXCEEDED",
        }
      )
    } else if (aiError.statusCode >= 400 && aiError.statusCode < 500) {
      // Other client errors
      return Object.assign(new Error(aiError.message || "Request failed"), {
        statusCode: aiError.statusCode,
        code: "CLIENT_ERROR",
      })
    } else {
      // Server errors or other issues
      return Object.assign(new Error(aiError.message || "AI service error"), {
        statusCode: aiError.statusCode || 500,
        code: "SERVER_ERROR",
      })
    }
  } else {
    // Fallback for unknown error format
    return Object.assign(
      new Error("AI generation failed. Please check your model or API key."),
      {
        statusCode: 500,
        code: "UNKNOWN_ERROR",
      }
    )
  }
}

/**
 * Create error response for API endpoints
 * @param error - Error object with optional statusCode and code
 * @returns Response object with proper status and JSON body
 */
export function createErrorResponse(error: {
  code?: string
  message?: string
  statusCode?: number
}): Response {
  // Handle daily limit first (existing logic)
  if (error.code === "DAILY_LIMIT_REACHED") {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 403 }
    )
  }

  // Handle stream errors with proper status codes
  if (error.statusCode) {
    return new Response(
      JSON.stringify({
        error: error.message || "Request failed",
        code: error.code || "REQUEST_ERROR",
      }),
      { status: error.statusCode }
    )
  }

  // Fallback for other errors
  return new Response(
    JSON.stringify({ error: error.message || "Internal server error" }),
    { status: 500 }
  )
}
