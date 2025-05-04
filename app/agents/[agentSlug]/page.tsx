import { AgentDetail } from "@/app/components/agents/agent-detail"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { createClient } from "@/lib/supabase/server"

export default async function AgentIdPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>
}) {
  const { agentSlug } = await params
  const supabase = await createClient()

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", agentSlug)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("*")
    .not("slug", "eq", agentSlug)
    .limit(4)

  if (agentsError) {
    throw new Error(agentsError.message)
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <div className="bg-background mx-auto max-w-3xl pt-20">
          <AgentDetail
            id={agent.id}
            slug={agent.slug}
            name={agent.name}
            description={agent.description}
            example_inputs={agent.example_inputs || []}
            creator_id={agent.creator_id}
            avatar_url={agent.avatar_url}
            randomAgents={agents || []}
            isFullPage
          />
        </div>
      </LayoutApp>
    </MessagesProvider>
  )
}
