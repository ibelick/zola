"use client"

import { AgentSummary } from "@/app/types/agent"
import { ZOLA_COMING_SOON_AGENTS } from "@/lib/config"
import { useMemo, useState } from "react"
import { DialogAgent } from "./dialog-agent"

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

  return (
    <div className="bg-background min-h-screen px-4 pt-20 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="text-foreground text-sm font-medium">Agents</h1>
          <div className="text-foreground mx-auto my-4 max-w-2xl text-3xl font-medium tracking-tight md:text-5xl">
            Your every day AI assistant
          </div>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            a growing set of personal AI agents, built for ideas, writing, and
            product work.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-foreground mb-1 text-lg font-medium">Featured</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <DialogAgent
                key={agent.id}
                id={agent.id}
                name={agent.name}
                description={agent.description}
                avatar_url={agent.avatar_url || "/placeholder.svg"}
                example_inputs={agent.example_inputs || []}
                creator_id={agent.creator_id || "Zola"}
                isAvailable={true}
                agents={agents}
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
                avatar_url={agent.avatar_url || "/placeholder.svg"}
                example_inputs={agent.example_inputs || []}
                creator_id={agent.creator_id || "Zola"}
                isAvailable={false}
                agents={agents}
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
