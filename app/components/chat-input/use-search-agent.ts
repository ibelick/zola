import { useAgent } from "@/lib/agent-store/provider"
import { localAgents } from "@/lib/agents/local-agents"
import { useCallback, useEffect, useState } from "react"

const SEARCH_AGENT_ID = "search"

export function useSearchAgent() {
  const [isSearchEnabled, setIsSearchEnabled] = useState(false)
  const { currentAgent } = useAgent()

  // Check if current agent is the search agent
  const isSearchAgentActive = currentAgent?.id === SEARCH_AGENT_ID

  // Sync search state with current agent
  useEffect(() => {
    setIsSearchEnabled(isSearchAgentActive)
  }, [isSearchAgentActive])

  const toggleSearch = useCallback((enabled: boolean) => {
    setIsSearchEnabled(enabled)
  }, [])

  // Return search agent ID when search is enabled, null otherwise
  const getActiveAgentId = useCallback(() => {
    return isSearchEnabled ? SEARCH_AGENT_ID : currentAgent?.id || null
  }, [isSearchEnabled, currentAgent?.id])

  // Check if search agent is available
  const isSearchAgentAvailable = SEARCH_AGENT_ID in localAgents

  return {
    isSearchEnabled,
    toggleSearch,
    getActiveAgentId,
    isSearchAgentAvailable,
    isSearchAgentActive,
  }
}
