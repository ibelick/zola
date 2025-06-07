import { Agent } from "@/app/types/agent"
import React from "react"
import { DialogAgent } from "./dialog-agent"

type AgentFeaturedSectionProps = {
  agents: Agent[]
  handleAgentClick: (agentId: string | null) => void
  openAgentId: string | null
  setOpenAgentId: (agentId: string | null) => void
  moreAgents: Agent[]
}

export function AgentFeaturedSection({
  agents,
  moreAgents,
  handleAgentClick,
  openAgentId,
  setOpenAgentId,
}: AgentFeaturedSectionProps) {
  if (!agents || agents.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="text-foreground mb-4 text-lg font-medium">Featured</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <DialogAgent
            key={agent.id}
            id={agent.id}
            name={agent.name}
            description={agent.description}
            avatar_url={agent.avatar_url}
            system_prompt={agent.system_prompt}
            example_inputs={agent.example_inputs || []}
            isAvailable={true}
            slug={agent.slug}
            onAgentClick={handleAgentClick}
            isOpen={openAgentId === agent.id}
            onOpenChange={(open) => setOpenAgentId(open ? agent.id : null)}
            randomAgents={moreAgents}
          />
        ))}
      </div>
    </div>
  )
}
