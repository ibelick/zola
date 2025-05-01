import { Agent } from "@/app/types/agent"
import { createClient } from "@/lib/supabase/client"

export async function loadGitHubAgent(
  agentSlug: string
): Promise<Agent | null> {
  const supabase = await createClient()

  if (agentSlug.startsWith("github/")) {
    const [_, owner, repo] = agentSlug.split("/")
    const slug = `github/${owner}/${repo}`

    const { data: existing } = await supabase
      .from("agents")
      .select("id, name, description, avatar_url, slug, tools_enabled")
      .eq("slug", slug)
      .single()

    if (existing) return existing as Agent

    const { data: created, error } = await supabase
      .from("agents")
      .insert({
        slug,
        name: `${owner}/${repo}`,
        description: `Chat with the GitHub repo ${owner}/${repo}`,
        avatar_url: `https://github.com/${owner}.png`,
        tools_enabled: true,
        mcp_config: {
          server: `https://gitmcp.io/${owner}/${repo}`,
          variables: [],
        },
        remixable: false,
        is_public: true,
        system_prompt:
          "You are a helpful GitHub assistant. Always use tools to answer repo questions.",
      })
      .select("id, name, description, avatar_url, slug, tools_enabled")
      .single()

    if (error || !created) {
      console.error("Failed to create GitHub agent", error)
      return null
    }

    return created as Agent
  }

  return null
}
