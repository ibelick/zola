"use client"

import { agentsConfig } from "@/app/agents/github/config"
import { DialogAgent } from "@/app/components/agents/dialog-agent"
import type { Agent } from "@/app/types/agent"
import { useState } from "react"

interface ClientGitHubCategoryProps {
  githubRepos: Agent[]
}

export function ClientGitHubCategory({
  githubRepos,
}: ClientGitHubCategoryProps) {
  const agentConfig = agentsConfig.find((agent) => agent.slug === "github")
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)

  const handleAgentClick = (agentId: string) => {
    setOpenAgentId(agentId)
  }

  const otherGithubAgents = githubRepos.filter(
    (repo) => repo.id !== openAgentId
  )

  return (
    <div className="bg-background min-h-screen px-4 pt-20 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-foreground text-sm font-medium uppercase">
            {agentConfig?.slug || "github"}
          </h1>
          <div className="text-foreground mx-auto my-4 max-w-2xl text-4xl font-medium tracking-tight">
            {agentConfig?.name || "GitHub Repository Agents"}
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            {agentConfig?.description ||
              "Chat with AI agents specialized in GitHub repositories. Get insights, explanations, and assistance with specific codebases."}
          </p>
        </div>

        <div className="mt-8">
          <div className="grid gap-4 md:grid-cols-2">
            {githubRepos?.map((repo) => (
              <DialogAgent
                key={repo.id}
                id={repo.id}
                slug={repo.slug}
                name={repo.name}
                description={repo.description}
                avatar_url={repo.avatar_url}
                example_inputs={repo.example_inputs || []}
                isAvailable={true}
                onAgentClick={handleAgentClick}
                isOpen={openAgentId === repo.id}
                onOpenChange={(open) => setOpenAgentId(open ? repo.id : null)}
                randomAgents={otherGithubAgents}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
