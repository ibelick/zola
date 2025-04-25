import { runAgent } from "@/app/api/agents/core/agentRunner"
import { runCompetitorTeardownAgent } from "@/app/api/agents/handlers/competitor-teardown"
import { runPositioningSnapshotAgent } from "@/app/api/agents/handlers/positioning-snapshot"
import { runResearchAgent } from "@/app/api/agents/handlers/research"
import { runSummarizeAgent } from "@/app/api/agents/handlers/summarize"

const AGENT_HANDLERS = {
  "zola-research": runResearchAgent,
  "zola-summarize": runSummarizeAgent,
  "competitor-teardown": runCompetitorTeardownAgent,
  "positioning-snapshot": runPositioningSnapshotAgent,
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const { agentSlug, ...rest } = body

  const handler = AGENT_HANDLERS[agentSlug as keyof typeof AGENT_HANDLERS]
  if (!handler) {
    return new Response(JSON.stringify({ error: "Unknown agent" }), {
      status: 400,
    })
  }

  return runAgent(rest, handler)
}
