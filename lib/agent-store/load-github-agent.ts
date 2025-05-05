import { Agent } from "@/app/types/agent"
import { toast } from "@/components/ui/toast"
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

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        toast({
          title: "Repository not found",
          description:
            "Please check the repository name and try again. It must be a public repository.",
        })
      } else {
        toast({
          title: "GitHub API error",
          description: `${response.status} ${response.statusText}`,
        })
      }
      return null
    }

    const repoData = await response.json()
    const repoDescription =
      repoData.description || `Chat with the GitHub repo ${owner}/${repo}`

    const system_prompt = `You are a helpful GitHub assistant focused on the repository: ${owner}/${repo}.
  
      Use the available tools below to answer any questions. Always prefer using tools over guessing.
      
      Tools available for this repository:
      - \`fetch_${repo}_documentation\`: Fetch the entire documentation file. Use this first when asked about general concepts in ${owner}/${repo}.
      - \`search_${repo}_documentation\`: Semantically search the documentation. Use this for specific questions.
      - \`search_${repo}_code\`: Search code with exact matches using the GitHub API. Use when asked about file contents or code examples.
      - \`fetch_generic_url_content\`: Fetch absolute URLs when referenced in the docs or needed for context.
      
      Never invent answers. Use tools and return what you find.`

    const { data: created, error } = await supabase
      .from("agents")
      .insert({
        slug,
        name: `${owner}/${repo}`,
        description: repoDescription,
        avatar_url: `https://github.com/${owner}.png`,
        tools_enabled: true,
        mcp_config: {
          server: `https://gitmcp.io/${owner}/${repo}`,
          variables: [],
        },
        example_inputs: [
          "what does this repository do?",
          "how to install the project?",
          "how can I use this project?",
          "where is the main code located?",
        ],
        remixable: false,
        is_public: true,
        system_prompt,
        max_steps: 5,
      })
      .select("id, name, description, avatar_url, slug, tools_enabled")
      .single()

    if (error || !created) {
      console.error("Failed to create GitHub agent", error)
      toast({
        title: "Failed to create GitHub agent",
        description: error?.message,
      })
      return null
    }

    return created as Agent
  }

  return null
}
