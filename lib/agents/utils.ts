import { localAgents } from "./local-agents"

/**
 * Check if an agent ID corresponds to a local agent
 */
export function isLocalAgent(agentId: string | null | undefined): boolean {
  if (!agentId) return false
  return agentId in localAgents
}

/**
 * Filter out local agent IDs, returning null if the agent is local
 * This is useful for database operations that should only receive database agent IDs
 */
export function filterLocalAgentId(
  agentId: string | null | undefined
): string | null {
  if (!agentId) return null
  return isLocalAgent(agentId) ? null : agentId
}
