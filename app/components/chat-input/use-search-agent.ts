import { useAgent } from "@/lib/agent-store/provider"
import { localAgents } from "@/lib/agents/local-agents"
import { useCallback, useState } from "react"

const SEARCH_AGENT_ID = "search"

export function useSearchAgent() {
  const { currentAgent } = useAgent()
  const isSearchAgentAvailable = SEARCH_AGENT_ID in localAgents

  const [isSearchEnabled, setIsSearchEnabled] = useState(() => {
    return currentAgent?.id === SEARCH_AGENT_ID
  })

  const isSearchAgentActive = isSearchEnabled

  const toggleSearch = useCallback((enabled: boolean) => {
    setIsSearchEnabled(enabled)
  }, [])

  const getActiveAgentId = useCallback(() => {
    return isSearchEnabled ? SEARCH_AGENT_ID : currentAgent?.id || null
  }, [isSearchEnabled, currentAgent?.id])

  return {
    isSearchEnabled,
    toggleSearch,
    getActiveAgentId,
    isSearchAgentAvailable,
    isSearchAgentActive,
  }
}
