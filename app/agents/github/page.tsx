import { ClientGitHubCategory } from "@/app/agents/github/client-github-category"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { createClient } from "@/lib/supabase/server"

export default async function GitHubAgentPage() {
  const supabase = await createClient()

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
