import { createClient } from "@/lib/supabase/server"
import { Tool } from "ai"
import { tools } from "./tools"

type ToolName = keyof typeof tools
type ToolType = Tool<any, any>

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

  const activeTools =
    !agent.tools || agent.tools.length === 0
      ? null
      : agent.tools.reduce<Record<ToolName, ToolType>>(
          (acc, toolName) => {
            if (tools[toolName as ToolName]) {
              acc[toolName as ToolName] = tools[
                toolName as ToolName
              ] as ToolType
            }
            return acc
          },
          {} as Record<ToolName, ToolType>
        )

  return {
    systemPrompt: agent.system_prompt,
    tools: activeTools,
    maxSteps: agent.max_steps ?? 5,
    mcpConfig: agent.mcp_config,
  }
}
