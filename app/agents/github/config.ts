export type AgentConfig = {
  slug: string
  name: string
  description: string
  isEnabled: boolean
}

export const agentsConfig: AgentConfig[] = [
  {
    slug: "github",
    name: "GitHub Repository Agents",
    description:
      "Chat with AI agents specialized in GitHub repositories. Get insights, explanations, and assistance with specific codebases.",
    isEnabled: true,
  },
]
