"use client"

import { Agent, AgentSummary } from "@/app/types/agent"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"
import { AgentFeaturedSection } from "./agent-featured-section"
import { DialogCreateAgentTrigger } from "./dialog-create-agent/dialog-trigger-create-agent"
import { UserAgentsSection } from "./user-agent-section"

type AgentsPageProps = {
  curatedAgents: Agent[]
  userAgents: Agent[] | null
  userId: string | null
}

export function AgentsPage({
  curatedAgents,
  userAgents,
  userId,
}: AgentsPageProps) {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)

  const randomAgents = useMemo(() => {
    return curatedAgents
      .filter((agent) => agent.id !== openAgentId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
  }, [curatedAgents, openAgentId])

  const handleAgentClick = (agentId: string) => {
    setOpenAgentId(agentId)
  }

  return (
    <div className="bg-background min-h-screen px-4 pt-20 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-20 text-center">
          <h1 className="text-foreground text-sm font-medium">Agents</h1>
          <div className="text-foreground mx-auto my-4 max-w-2xl text-3xl font-medium tracking-tight md:text-5xl">
            Your every day AI assistant
          </div>
          <p className="text-muted-foreground mx-auto mb-4 max-w-2xl text-lg">
            a growing set of personal AI agents, built for ideas, writing, and
            product work.
          </p>
          <DialogCreateAgentTrigger
            trigger={
              <Button variant="outline" className="rounded-full">
                Create an agent
              </Button>
            }
          />
        </div>

        <AgentFeaturedSection
          agents={curatedAgents}
          moreAgents={randomAgents}
          handleAgentClick={handleAgentClick}
          openAgentId={openAgentId}
          setOpenAgentId={setOpenAgentId}
        />
        <UserAgentsSection
          agents={userAgents || null}
          moreAgents={randomAgents}
          userId={userId || null}
          handleAgentClick={handleAgentClick}
          openAgentId={openAgentId}
          setOpenAgentId={setOpenAgentId}
        />
      </div>
    </div>
  )
}
