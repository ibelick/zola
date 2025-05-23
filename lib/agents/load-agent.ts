import { createClient } from "@/lib/supabase/server"
import { TOOL_REGISTRY, ToolId } from "../tools"

export async function loadAgent(agentId: string) {
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
    ? agent.tools
        .map((toolId: string) => {
          const tool = TOOL_REGISTRY[toolId as ToolId]
          if (!tool) return null
          if (!tool.isAvailable?.()) return null
          return tool
        })
        .filter(Boolean)
    : []

  return {
    systemPrompt: agent.system_prompt,
    tools: activeTools,
    maxSteps: agent.max_steps ?? 5,
    mcpConfig: agent.mcp_config,
  }
}
