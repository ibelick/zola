import { AgentDetail } from "@/app/components/agents/agent-detail"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function AgentIdPage({
  params,
}: {
  params: Promise<{ agentSlug: string | string[] }>
}) {
  if (!isSupabaseEnabled) {
    notFound()
  }

  const { agentSlug: slugParts } = await params
  const agentSlug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts

  const supabase = await createClient()

  if (!supabase) {
    notFound()
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", agentSlug)
    .single()

  if (agentError) {
    throw new Error(agentError.message)
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
            slug={agent.slug}
            name={agent.name}
            description={agent.description}
            example_inputs={agent.example_inputs || []}
            creator_id={agent.creator_id}
            avatar_url={agent.avatar_url}
            randomAgents={agents || []}
            isFullPage
            system_prompt={agent.system_prompt}
            tools={agent.tools}
            mcp_config={agent.mcp_config}
          />
        </div>
      </LayoutApp>
    </MessagesProvider>
  )
}
