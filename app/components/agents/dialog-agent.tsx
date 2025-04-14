import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { AgentSummary } from "@/app/types/agent"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { AgentCard } from "./agent-card"
import { AgentDetail } from "./agent-detail"

type DialogAgentProps = {
  id: string
  name: string
  description: string
  avatar_url: string
  example_inputs: string[]
  creator_id: string
  className?: string
  isAvailable: boolean
  agents: AgentSummary[]
  onAgentClick?: (agentId: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  randomAgents: AgentSummary[]
}

export function DialogAgent({
  id,
  name,
  description,
  creator_id,
  avatar_url,
  example_inputs,
  agents,
  className,
  isAvailable,
  onAgentClick,
  isOpen,
  onOpenChange,
  randomAgents,
}: DialogAgentProps) {
  const isMobile = useBreakpoint(768)

  const handleOpenChange = (open: boolean) => {
    if (isAvailable) {
      onOpenChange(open)
    }
  }

  const renderContent = () => (
    <AgentDetail
      id={id}
      name={name}
      description={description}
      example_inputs={example_inputs}
      creator_id={creator_id}
      avatar_url={avatar_url}
      agents={agents}
      onAgentClick={onAgentClick}
      randomAgents={randomAgents}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <AgentCard
            id={id}
            name={name}
            description={description}
            creator_id={creator_id}
            avatar_url={avatar_url}
            className={className}
            isAvailable={isAvailable}
            onClick={() => handleOpenChange(true)}
          />
        </DrawerTrigger>
        <DrawerContent className="bg-background border-border">
          {renderContent()}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <AgentCard
          id={id}
          name={name}
          description={description}
          creator_id={creator_id}
          avatar_url={avatar_url}
          className={className}
          isAvailable={isAvailable}
          onClick={() => handleOpenChange(true)}
        />
      </DialogTrigger>
      <DialogContent className="[&>button:last-child]:bg-background max-w-[600px] gap-0 overflow-hidden rounded-3xl p-0 shadow-xs [&>button:last-child]:rounded-full [&>button:last-child]:p-1">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
