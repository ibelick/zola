import { AgentsPage } from "@/app/components/agents/agents-page"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import {
  ZOLA_AGENTS_SLUGS,
  ZOLA_GITHUB_AGENTS_SLUGS,
  ZOLA_SPECIAL_AGENTS_SLUGS,
} from "@/lib/config"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const ZOLA_ALL_AGENTS_SLUGS = [
  ...ZOLA_AGENTS_SLUGS,
  ...ZOLA_SPECIAL_AGENTS_SLUGS,
  ...ZOLA_GITHUB_AGENTS_SLUGS,
]

export default async function Page() {
  const supabase = await createClient()

  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select(
      "id, name, description, avatar_url, example_inputs, creator_id, slug"
    )
    .in("slug", ZOLA_ALL_AGENTS_SLUGS)

  if (agentsError) {
    throw new Error(agentsError.message)
  }

  if (!agents || agents.length === 0) {
    return <div>No agents found</div>
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <AgentsPage agents={agents} />
      </LayoutApp>
    </MessagesProvider>
  )
}
