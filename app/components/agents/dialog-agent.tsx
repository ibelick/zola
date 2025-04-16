import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useUser } from "@/app/providers/user-provider"
import { AgentSummary } from "@/app/types/agent"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { PopoverContentAuth } from "../chat-input/popover-content-auth"
import { AgentCard } from "./agent-card"
import { AgentDetail } from "./agent-detail"

type DialogAgentProps = {
  id: string
  name: string
  description: string
  avatar_url?: string | null
  example_inputs: string[]
  creator_id: string
  className?: string
  isAvailable: boolean
  agents: AgentSummary[]
  slug: string
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
  slug,
  className,
  isAvailable,
  onAgentClick,
  isOpen,
  onOpenChange,
  randomAgents,
}: DialogAgentProps) {
  const isMobile = useBreakpoint(768)
  const { user } = useUser()

  const handleOpenChange = (open: boolean) => {
    if (!isAvailable) {
      return
    }

    window.history.replaceState(null, "", `/agents/${slug}`)
    onOpenChange(open)
  }

  if (!user) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div>
            <AgentCard
              id={id}
              name={name}
              description={description}
              creator_id={creator_id}
              avatar_url={avatar_url}
              className={className}
              isAvailable={isAvailable}
            />
          </div>
        </PopoverTrigger>
        <PopoverContentAuth />
      </Popover>
    )
  }

  const renderContent = (isMobile?: boolean) => (
    <AgentDetail
      id={id}
      slug={slug}
      name={name}
      description={description}
      example_inputs={example_inputs}
      creator_id={creator_id}
      avatar_url={avatar_url}
      onAgentClick={onAgentClick}
      randomAgents={randomAgents}
      isMobile={isMobile}
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
          {renderContent(isMobile)}
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
