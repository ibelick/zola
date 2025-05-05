export type AgentConfig = {
  slug: string
  name: string
  description: string
  isEnabled: boolean
}

export const agentsConfig: AgentConfig[] = [
  {
    slug: "github",
    name: "GitHub Agents",
    description:
      "Chat with AI agents specialized in GitHub repositories. Get insights, explanations, and assistance with specific codebases.",
    isEnabled: true,
  },
] as const
