import { AgentDetail } from "@/app/components/agents/agent-detail"
import { createClient } from "@/lib/supabase/server"

export default async function AgentIdPage({
  params,
}: {
  params: { agentSlug: string }
}) {
  const { agentSlug } = await params
  const supabase = await createClient()

  const { data: agent, error } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", agentSlug)
    .single()

  if (error) {
    console.error("Error fetching agent", error)
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h1>{agent.name}</h1>
      <p>{agent.description}</p>
    </div>
  )
}
