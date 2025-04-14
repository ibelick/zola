import { ZOLA_AGENT_SLUGS } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"

export const revalidate = 60
export const dynamic = "force-static"

export default async function AgentsPage() {
  const supabase = await createClient()

  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("id, name, description, avatar_url, example_inputs, creator_id")
    .in("slug", ZOLA_AGENT_SLUGS)

  console.log("agents", agents)

  if (agentsError) {
    console.error(agentsError)
    return <div>Error loading agents</div>
  }

  if (!agents || agents.length === 0) {
    return <div>No agents found</div>
  }

  return <div>AgentsPage</div>
}
