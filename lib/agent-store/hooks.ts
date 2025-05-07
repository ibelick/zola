import { useAgentContext } from "./provider"

export const useAgent = () => {
  const { status: statusFetch, setStatus, agent } = useAgentContext()
  const isTooling = agent?.tools_enabled

  return {
    statusFetch,
    setStatus,
    isTooling,
    agent,
  }
}
