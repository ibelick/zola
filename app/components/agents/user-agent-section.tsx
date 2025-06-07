import { Agent } from "@/app/types/agent"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { DialogAgent } from "./dialog-agent"
import { DialogCreateAgentTrigger } from "./dialog-create-agent/dialog-trigger-create-agent"

type UserAgentsSectionProps = {
  agents: Agent[] | null
  userId?: string | null
  handleAgentClick: (agentId: string | null) => void
  openAgentId: string | null
  setOpenAgentId: (agentId: string | null) => void
  moreAgents: Agent[]
}

export function UserAgentsSection({
  agents,
  userId,
  handleAgentClick,
  openAgentId,
  setOpenAgentId,
  moreAgents,
}: UserAgentsSectionProps) {
  const hasUserAgents = agents && agents.length > 0

  // Not authenticated
  if (!userId) {
    return (
      <Card className="mt-8 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <h3 className="mb-2 text-lg font-medium">
            Want to create your own agents?
          </h3>
          <p className="text-muted-foreground mb-4">
            Sign in to create and manage custom AI agents
          </p>
          <Button asChild>
            <Link href="/auth">Sign in to get started</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Authenticated but no agents
  if (userId && !hasUserAgents) {
    return (
      <div className="mt-8 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <h3 className="mb-2 text-lg font-medium">
            You haven&apos;t created any agents yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first custom agent to get started
          </p>
          <DialogCreateAgentTrigger
            trigger={<Button>Create an agent</Button>}
          />
        </CardContent>
      </div>
    )
  }

  // Authenticated with agents
  return (
    <div className="mt-12">
      <h2 className="text-foreground mb-4 text-lg font-medium">Your agents</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {agents?.map((agent) => (
          <DialogAgent
            key={agent.id}
            id={agent.id}
            name={agent.name}
            description={agent.description}
            avatar_url={agent.avatar_url}
            example_inputs={agent.example_inputs || []}
            isAvailable={true}
            onAgentClick={handleAgentClick}
            isOpen={openAgentId === agent.id}
            onOpenChange={(open) => setOpenAgentId(open ? agent.id : null)}
            randomAgents={moreAgents}
            slug={agent.slug}
            system_prompt={agent.system_prompt}
            tools={agent.tools}
            mcp_config={agent.mcp_config}
            creator_id={agent.creator_id}
          />
        ))}
      </div>
    </div>
  )
}
