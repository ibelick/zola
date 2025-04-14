import { AgentsPage } from "@/app/components/agents/agents-page"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { ZOLA_AGENT_SLUGS } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"

export const revalidate = 60
export const dynamic = "force-static"

export default async function Page() {
  const supabase = await createClient()

  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, example_inputs, creator_id")
    .in("slug", ZOLA_AGENT_SLUGS)

  if (agentsError) {
    console.error(agentsError)
    return <div>Error loading agents</div>
  }

  if (!agents || agents.length === 0) {
    return <div>No agents found</div>
  }

  return (
    <LayoutApp>
      <AgentsPage agents={agents} />
    </LayoutApp>
  )
}
