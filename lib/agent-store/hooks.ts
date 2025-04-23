import { useUser } from "@/app/providers/user-provider"
import { ZOLA_SPECIAL_AGENTS_IDS } from "@/lib/config"
import { useEffect } from "react"
import { fetchClient } from "../fetch"
import { useAgentContext } from "./provider"

type UseAgentProps = {
  initialAgentId?: string
}

export const useAgent = ({ initialAgentId }: UseAgentProps) => {
  const { user } = useUser()
  const { agentId, setAgentId, status, setStatus } = useAgentContext()

  //   @todo: need to move, no need initialAgentId
  useEffect(() => {
    if (initialAgentId) {
      setAgentId(initialAgentId)
    }
  }, [initialAgentId, setAgentId])

  const isZolaResearch = agentId
    ? ZOLA_SPECIAL_AGENTS_IDS.includes(agentId)
    : false

  async function callZolaResearchAgent({
    prompt,
    chatId,
    userId,
  }: {
    prompt: string
    chatId: string
    userId: string
  }) {
    const res = await fetchClient("/api/agents/handle", {
      method: "POST",
      body: JSON.stringify({
        agentId: "zola-research",
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
    setAgentId,
    status,
    setStatus,
    isZolaResearch,
    callZolaResearchAgent,
  }
}
