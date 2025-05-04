import { Agent } from "@/app/types/agent"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { DialogGitHubAgentContent } from "./dialog-github-agent/github-agent-content"

type RepoSummary = {
  id: string
  name: string
  description: string
  avatar_url: string
  example_inputs?: string[]
  creator_id?: string
}

type GitHubRepoAgentProps = {
  id: string
  name: string
  description: string
  avatar_url?: string
  example_inputs?: string[]
  creator_id?: string
  className?: string
  isAvailable: boolean
  agents: Pick<
    Agent,
    | "id"
    | "name"
    | "description"
    | "avatar_url"
    | "example_inputs"
    | "creator_id"
  >[]
  user_id?: string
  onAgentClick?: (agentId: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  randomAgents: Pick<
    Agent,
    | "id"
    | "name"
    | "description"
    | "avatar_url"
    | "example_inputs"
    | "creator_id"
  >[]
}

export function GitHubRepoAgent({
  id,
  name,
  description,
  creator_id = "GitHub",
  avatar_url,
  example_inputs = [],
  agents,
  className,
  isAvailable,
  user_id,
  onAgentClick,
  isOpen,
  onOpenChange,
  randomAgents,
}: GitHubRepoAgentProps) {
  const handleOpenChange = (open: boolean) => {
    if (isAvailable) {
      onOpenChange(open)
    }
  }

  // Get the repository avatar URL from GitHub
  const getRepoAvatarUrl = () => {
    if (avatar_url) return avatar_url

    const getRepoName = name.split("/")[0]
    return `https://github.com/${getRepoName}.png`
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
                    src={getRepoAvatarUrl()}
                    alt={name}
                    className="h-full w-full object-cover"
                    key={getRepoAvatarUrl()}
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
          avatar_url={getRepoAvatarUrl()}
          agents={agents}
          user_id={user_id}
          onAgentClick={onAgentClick}
          randomAgents={randomAgents}
        />
      </DialogContent>
    </Dialog>
  )
}
