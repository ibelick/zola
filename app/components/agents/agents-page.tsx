"use client"

import { AgentSummary } from "@/app/types/agent"
import {
  ZOLA_AGENTS_SLUGS,
  ZOLA_COMING_SOON_AGENTS,
  ZOLA_GITHUB_AGENTS_SLUGS,
  ZOLA_SPECIAL_AGENTS_SLUGS,
} from "@/lib/config"
import Link from "next/link"
import { useMemo, useState } from "react"
import { DialogAgent } from "./dialog-agent"
import { CreateGitHubAgentDialog } from "./dialog-create-github-agent"
import { ResearchSection } from "./research-section"

type AgentsPageProps = {
  agents: AgentSummary[]
}

export function AgentsPage({ agents }: AgentsPageProps) {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)

  const randomAgents = useMemo(() => {
    return agents
      .filter((agent) => agent.id !== openAgentId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
  }, [agents, openAgentId])

  const handleAgentClick = (agentId: string) => {
    setOpenAgentId(agentId)
  }

  const researchAgent = agents.find((agent) =>
    ZOLA_SPECIAL_AGENTS_SLUGS.includes(agent.slug)
  )

  const featuredAgents = agents.filter((agent) =>
    ZOLA_AGENTS_SLUGS.includes(agent.slug)
  )

  const githubAgents = agents.filter((agent) =>
    ZOLA_GITHUB_AGENTS_SLUGS.includes(agent.slug)
  )

  const otherGithubAgents = githubAgents.filter(
    (agent) => agent.id !== openAgentId
  )

  return (
    <div className="bg-background min-h-screen px-4 pt-20 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-20 text-center">
          <h1 className="text-foreground text-sm font-medium">Agents</h1>
          <div className="text-foreground mx-auto my-4 max-w-2xl text-3xl font-medium tracking-tight md:text-5xl">
            Your every day AI assistant
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            a growing set of personal AI agents, built for ideas, writing, and
            product work.
          </p>
        </div>

        {githubAgents.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-lg font-medium">GitHub</h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/agents/github"
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  View all
                </Link>
                <CreateGitHubAgentDialog />
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              Chat with any GitHub repository.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {githubAgents.map((agent) => (
                <DialogAgent
                  key={agent.id}
                  id={agent.id}
                  slug={agent.slug}
                  name={agent.name}
                  description={agent.description}
                  avatar_url={agent.avatar_url}
                  example_inputs={agent.example_inputs || []}
                  isAvailable={true}
                  onAgentClick={handleAgentClick}
                  isOpen={openAgentId === agent.id}
                  onOpenChange={(open) =>
                    setOpenAgentId(open ? agent.id : null)
                  }
                  randomAgents={otherGithubAgents}
                />
              ))}
            </div>
          </div>
        )}

        {researchAgent && (
          <ResearchSection
            researchAgent={researchAgent}
            agents={agents}
            handleAgentClick={handleAgentClick}
            openAgentId={openAgentId}
            setOpenAgentId={setOpenAgentId}
            randomAgents={randomAgents}
          />
        )}

        <div className="mt-12">
          <h2 className="text-foreground text-lg font-medium">More</h2>
          <p className="text-muted-foreground mb-4">
            Simple, useful agents, with custom system prompts.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredAgents.map((agent) => (
              <DialogAgent
                key={agent.id}
                id={agent.id}
                slug={agent.slug}
                name={agent.name}
                description={agent.description}
                avatar_url={agent.avatar_url}
                creator_id="Zola"
                example_inputs={agent.example_inputs || []}
                isAvailable={true}
                onAgentClick={handleAgentClick}
                isOpen={openAgentId === agent.id}
                onOpenChange={(open) => setOpenAgentId(open ? agent.id : null)}
                randomAgents={randomAgents}
              />
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-foreground mb-1 text-lg font-medium">
            Coming Soon
          </h2>
          <div className="relative grid gap-4 md:grid-cols-2">
            {ZOLA_COMING_SOON_AGENTS.slice(0, 4).map((agent) => (
              <DialogAgent
                key={agent.id}
                id={agent.id}
                name={agent.name}
                description={agent.description}
                avatar_url={agent?.avatar_url}
                example_inputs={agent.example_inputs || []}
                creator_id="Zola"
                slug={agent.slug}
                isAvailable={false}
                className="pointer-events-none opacity-50 select-none"
                onAgentClick={handleAgentClick}
                isOpen={openAgentId === agent.id}
                onOpenChange={(open) => setOpenAgentId(open ? agent.id : null)}
                randomAgents={randomAgents}
              />
            ))}
            <div className="from-background absolute -inset-x-2.5 bottom-0 h-[50%] bg-gradient-to-t to-transparent sm:h-[75%]" />
          </div>
        </div>
      </div>
    </div>
  )
}
