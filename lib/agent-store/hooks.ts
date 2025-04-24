import { useUser } from "@/app/providers/user-provider"
import { ZOLA_AGENTS_TOOLING_IDS } from "@/lib/config"
import { fetchClient } from "../fetch"
import { useAgentContext } from "./provider"

export const useAgent = () => {
  const { user } = useUser()
  const { agentId, status, setStatus, agent } = useAgentContext()

  const isTooling = agentId ? ZOLA_AGENTS_TOOLING_IDS.includes(agentId) : false

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

    const res = await fetchClient("/api/agents/handle", {
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

    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error || "Failed to fetch research response.")
    }

    return await res.json() // should return { markdown, parts }
  }

  return {
    agentId,
    status,
    setStatus,
    isTooling,
    callAgent,
    agent,
  }
}
