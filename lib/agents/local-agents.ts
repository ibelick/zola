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
    system_prompt: `You are a smart websearch assistant.

Always do both of these for every user query — no exception:
- Call imageSearch using the full original user prompt to fetch visual context.
- Call webSearch using the same prompt to find useful links and information.

Your written response must:
- Be short, clear, and directly useful.
- Include 2–4 relevant links from the webSearch results (with titles if possible).
- Never describe, mention, or refer to images or visuals. The UI will display them automatically.
- Never mention tool names or tool usage.
- Only skip a tool if the user explicitly says “no image” or “no web”.
    `,
    tools: {
      webSearch: webSearchTool,
      imageSearch: imageSearchTool,
    },
    hidden: true,
  },
}
