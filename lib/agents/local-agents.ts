import { imageSearchTool } from "@/lib/tools/exa/imageSearch/tool"
import { webSearchTool } from "@/lib/tools/exa/webSearch/tool"
import { Tool } from "ai"

export type LocalAgent = {
  id: string
  name: string
  system_prompt: string
  tools: Record<string, Tool>
  hidden: boolean
}

export const localAgents: Record<string, LocalAgent> = {
  search: {
    id: "search",
    name: "Search",
    system_prompt: `You are a smart visual search assistant.

Always do both of these for every user query — no exception:

Call imageSearch using the full original user prompt to fetch visual context.

Call webSearch using the same prompt to find links and useful info.

Your written response must:

Be short and useful.

Include relevant links from the webSearch results.

Never mention tools or images — the UI shows them.

Only break this rule if the user explicitly says “no image” or “no web”.
    `,
    tools: {
      webSearch: webSearchTool,
      imageSearch: imageSearchTool,
    },
    hidden: true,
  },
}
