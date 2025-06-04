import { createClient } from "@/lib/supabase/server"
import { TOOL_REGISTRY, ToolId } from "../tools"
import { localAgents } from "./local-agents"

export async function loadAgent(agentId: string) {
  // Check local agents first
  if (localAgents[agentId as keyof typeof localAgents]) {
    const localAgent = localAgents[agentId as keyof typeof localAgents]

    return {
      systemPrompt: localAgent.system_prompt,
      tools: localAgent.tools,
      maxSteps: 5,
      mcpConfig: null,
    }
  }

  // Fallback to database agents
  const supabase = await createClient()

  if (!supabase) {
    throw new Error("Supabase is not configured")
  }

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .maybeSingle()

  if (error || !agent) {
    throw new Error("Agent not found")
  }

  const activeTools = Array.isArray(agent.tools)
    ? agent.tools.reduce((acc: Record<string, unknown>, toolId: string) => {
        const tool = TOOL_REGISTRY[toolId as ToolId]
        if (!tool) return acc
        if (tool.isAvailable?.() === false) return acc
        acc[toolId] = tool
        return acc
      }, {})
    : {}

  return {
    systemPrompt: agent.system_prompt,
    tools: activeTools,
    maxSteps: agent.max_steps ?? 5,
    mcpConfig: agent.mcp_config,
  }
}
