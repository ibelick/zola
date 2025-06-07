import { AgentSummary } from "@/app/types/agent"
import { ArrowUpRight } from "@phosphor-icons/react"
import Image from "next/image"
import { DialogAgent } from "./dialog-agent"

type ResearchSectionProps = {
  researchAgent: AgentSummary
  handleAgentClick: (agentId: string | null) => void
  openAgentId: string | null
  setOpenAgentId: (agentId: string | null) => void
  randomAgents: AgentSummary[]
}
export function ResearchSection({
  researchAgent,
  handleAgentClick,
  openAgentId,
  setOpenAgentId,
  randomAgents,
}: ResearchSectionProps) {
  return (
    <div className="mt-12">
      <h2 className="text-foreground text-lg font-medium">Research</h2>
      <p className="text-muted-foreground mb-4">
        Backed by real-time web search. Ideal for deep, accurate research.
      </p>
      <DialogAgent
        key={researchAgent.id}
        id={researchAgent.id}
        slug={researchAgent.slug}
        name={researchAgent.name}
        description={researchAgent.description}
        avatar_url={researchAgent.avatar_url}
        example_inputs={researchAgent.example_inputs || []}
        isAvailable={true}
        onAgentClick={handleAgentClick}
        isOpen={openAgentId === researchAgent.id}
        onOpenChange={(open) => setOpenAgentId(open ? researchAgent.id : null)}
        randomAgents={randomAgents}
        system_prompt={researchAgent.system_prompt}
        tools={researchAgent.tools || []}
        mcp_config={researchAgent.mcp_config}
        trigger={
          <button
            className="group w-full items-end justify-start"
            type="button"
          >
            <div className="relative min-h-[140px] w-full overflow-hidden rounded-2xl shadow-lg md:aspect-[4/1]">
              <div className="absolute inset-0">
                <Image
                  src="/banner_cloud.jpg"
                  alt="Cloud background"
                  fill
                  className="object-cover transition-all duration-300 group-hover:scale-105"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent dark:from-black/70 dark:via-black/20" />

              <div className="relative flex h-full min-h-[140px] flex-col p-5">
                {/* <div className="self-start rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
        Research
      </div> */}

                <div className="mt-auto flex flex-row items-end justify-between gap-2">
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <h3 className="text-2xl leading-tight font-medium text-white">
                      Zola Research
                    </h3>

                    <p className="text-sm text-white/80">
                      Summarizes sources, finds answers. Helps you explore any
                      topic, fast, focused, and clear.
                    </p>
                  </div>
                  <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </button>
        }
      />
    </div>
  )
}
