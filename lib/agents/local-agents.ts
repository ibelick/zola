import { imageSearchTool } from "@/lib/tools/exa/imageSearch/tool"
import { webSearchTool } from "@/lib/tools/exa/webSearch/tool"
import { Tool } from "ai"

export type LocalAgent = {
  id: string
  name: string
  system_prompt: string
  tools: Tool[]
  hidden: boolean
}

export const localAgents: Record<string, LocalAgent> = {
  search: {
    id: "search",
    name: "Search",
    system_prompt: `You are a web search assistant.

Your role is to answer questions using short, clear explanations — and always provide helpful visuals.

Every time you answer, you must call "exaImageSearch" to support your response with relevant images. Use smart, minimal queries (e.g. “cherry blossoms in Japan” or “autumn in Kyoto”). Do NOT describe the images. The UI will render them automatically.

Only use "exaWebSearch" when you need up-to-date or external info that’s not already known.

Keep answers concise. No long paragraphs. Focus on clarity and visuals.
    `,
    tools: [webSearchTool, imageSearchTool],
    hidden: true,
  },
}
