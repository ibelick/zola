import { ClientGitHubCategory } from "@/app/agents/github/client-github-category"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function GitHubAgentPage() {
  if (!isSupabaseEnabled) {
    notFound()
  }

  const supabase = await createClient()

  if (!supabase) {
    notFound()
  }

  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("*")
    .ilike("slug", "github/%")

  if (agentsError) {
    throw new Error(agentsError.message)
  }

  if (!agents) {
    return <div>No agents found</div>
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <ClientGitHubCategory githubRepos={agents} />
      </LayoutApp>
    </MessagesProvider>
  )
}
