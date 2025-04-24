import { useUser } from "@/app/providers/user-provider"
import { useState } from "react"
import { fetchClient } from "../fetch"
import { API_ROUTE_AGENT_CALL } from "../routes"
import { useAgentContext } from "./provider"

export const useAgent = () => {
  const { user } = useUser()
  const { status: statusFetch, setStatus, agent } = useAgentContext()
  const [statusCall, setStatusCall] = useState<"idle" | "loading">("idle")
  const isTooling = agent?.tools_enabled

  async function callAgent({
    prompt,
    chatId,
    userId,
  }: {
    prompt: string
    chatId: string
    userId: string
  }) {
    if (!agent) {
      throw new Error("Agent not found")
    }

    setStatusCall("loading")
    const res = await fetchClient(API_ROUTE_AGENT_CALL, {
      method: "POST",
      body: JSON.stringify({
        agentSlug: agent.slug,
        prompt,
        chatId,
        userId,
        isAuthenticated: !!user?.id,
      }),
      headers: { "Content-Type": "application/json" },
    })

    setStatusCall("idle")

    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error || "Failed to fetch research response.")
    }

    return await res.json() // should return { markdown, parts }
  }

  return {
    statusFetch,
    statusCall,
    setStatus,
    isTooling,
    callAgent,
    agent,
  }
}
