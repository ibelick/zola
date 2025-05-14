import { AgentsPage } from "@/app/components/agents/agents-page"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { CURATED_AGENTS_SLUGS } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function Page() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()

  const { data: curatedAgents, error: agentsError } = await supabase
    .from("agents")
    .select("*")
    .in("slug", CURATED_AGENTS_SLUGS)

  const { data: userAgents, error: userAgentsError } = userData?.user?.id
    ? await supabase
        .from("agents")
        .select("*")
        .eq("creator_id", userData?.user?.id)
    : { data: [], error: null }

  if (agentsError) {
    console.error(agentsError)
    return <div>Error loading agents</div>
  }

  if (userAgentsError) {
    console.error(userAgentsError)
    return <div>Error loading user agents</div>
  }

  if (!curatedAgents || curatedAgents.length === 0) {
    return <div>No agents found</div>
  }
  return (
    <MessagesProvider>
      <LayoutApp>
        <AgentsPage
          curatedAgents={curatedAgents}
          userAgents={userAgents || null}
          userId={userData?.user?.id || null}
        />
      </LayoutApp>
    </MessagesProvider>
  )
}
