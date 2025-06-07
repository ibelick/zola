import type { Agent } from "@/app/types/agent"
import type { LocalAgent } from "@/lib/agents/local-agents"

export const convertLocalAgentToAgentDb = (localAgent: LocalAgent) => {
  const convertedAgent: Agent = {
    id: localAgent.id,
    name: localAgent.name,
    description: "",
    system_prompt: localAgent.system_prompt,
    tools: [],
    slug: localAgent.id,
    avatar_url: null,
    category: null,
    created_at: null,
    creator_id: null,
    example_inputs: null,
    is_public: false,
    model_preference: null,
    remixable: false,
    tags: null,
    tools_enabled: true,
    updated_at: null,
    max_steps: null,
    mcp_config: null,
  }

  return convertedAgent
}
