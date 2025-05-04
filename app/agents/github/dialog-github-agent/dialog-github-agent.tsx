import { Agent } from "@/app/types/agent"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { DialogGitHubAgentContent } from "./github-agent-content"

type AgentSummary = Pick<
  Agent,
  "id" | "name" | "description" | "avatar_url" | "example_inputs" | "creator_id"
>

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
  // @todo: to remove before production
  user_id?: string
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
  // @todo: to remove before production
  user_id,
  onAgentClick,
  isOpen,
  onOpenChange,
  randomAgents,
}: DialogAgentProps) {
  const handleOpenChange = (open: boolean) => {
    if (isAvailable) {
      onOpenChange(open)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "bg-secondary hover:bg-accent cursor-pointer rounded-xl p-4 transition-colors",
            className
          )}
          type="button"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="bg-muted h-16 w-16 overflow-hidden rounded-full">
                <Avatar className="h-full w-full object-cover">
                  <AvatarImage
                    src={avatar_url || "/placeholder.svg"}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                </Avatar>
              </div>
            </div>

            <div className="min-w-0 flex-1 text-left">
              <h3 className="text-foreground truncate text-base font-medium">
                {name}
              </h3>

              <p className="text-foreground mt-1 line-clamp-3 text-sm md:line-clamp-2">
                {description}
              </p>

              <p className="text-muted-foreground mt-2 text-xs">
                By {creator_id}
              </p>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto p-0">
        <DialogGitHubAgentContent
          id={id}
          name={name}
          description={description}
          example_inputs={example_inputs}
          creator_id={creator_id}
          avatar_url={avatar_url}
          agents={agents}
          // @todo: to remove before production
          user_id={user_id}
          onAgentClick={onAgentClick}
          randomAgents={randomAgents}
        />
      </DialogContent>
    </Dialog>
  )
}
