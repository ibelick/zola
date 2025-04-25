import { SpecialAgentLimitError, UsageLimitError } from "@/lib/api"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  incrementUsageCounters,
  saveAssistantMessage,
  saveUserMessage,
  validateRequest,
} from "./tools/usage"
import { AgentOutput, jsonRes } from "./types"

type AgentFunction<T> = (prompt: string) => Promise<T>

/**
 * Generic agent runner that handles validation, execution, and persisting results
 */
export async function runAgent<T extends AgentOutput>(
  data: {
    prompt: string
    chatId: string
    userId: string
    isAuthenticated: boolean
  },
  agentFunction: AgentFunction<T>
) {
  const start = Date.now()
  try {
    // Extract and validate request data
    const { prompt, chatId, userId, isAuthenticated } = data

    let supabase: SupabaseClient
    let sanitizedPrompt: string

    try {
      const result = await validateRequest(
        userId,
        isAuthenticated,
        prompt,
        chatId
      )
      supabase = result.supabase
      sanitizedPrompt = result.sanitizedPrompt
    } catch (e) {
      if (e instanceof UsageLimitError || e instanceof SpecialAgentLimitError) {
        return jsonRes({ error: e.message, code: e.code }, 403)
      }
      console.error("❌ Identity / limit check failed", e)
      return jsonRes({ error: "Auth or quota check failed" }, 401)
    }

    // Save user message
    try {
      await saveUserMessage(supabase, chatId, userId, sanitizedPrompt)
    } catch (e) {
      console.error("❌ Failed to save user message", e)
      return jsonRes({ error: "Database error when saving message" }, 502)
    }

    // Run agent
    let result: T
    try {
      result = await agentFunction(sanitizedPrompt)
    } catch (e) {
      console.error("❌ Agent execution failed", e)
      return jsonRes({ error: "Agent execution failed" }, 502)
    }

    // Save assistant message
    try {
      await saveAssistantMessage(
        supabase,
        chatId,
        userId,
        result.markdown,
        result.parts
      )
    } catch (e) {
      console.error("❌ Failed to save assistant message", e)
      return jsonRes(
        { error: "Database error when saving assistant reply" },
        502
      )
    }

    // Update usage counters
    await incrementUsageCounters(supabase, userId)

    console.info(
      `✅ Agent completed in ${Date.now() - start} ms (chat ${chatId})`
    )
    return jsonRes(result, 200)
  } catch (err) {
    // Handle unexpected errors
    console.error("🛑 Fatal error in agent execution", err)
    return jsonRes(
      {
        error: "Internal server error",
        detail: "An unexpected error occurred. Please try again later.",
      },
      500
    )
  }
}
