import { AgentSummary } from "@/app/types/agent"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type AgentCardProps = {
  id: string
  name: string
  description: string
  avatar_url: string
  creator_id: string
  className?: string
  isAvailable: boolean
  onClick?: () => void
}

export function AgentCard({
  name,
  description,
  creator_id,
  avatar_url,
  className,
  isAvailable,
  onClick,
}: AgentCardProps) {
  return (
    <button
      className={cn(
        "bg-secondary hover:bg-accent cursor-pointer rounded-xl p-4 transition-colors",
        className,
        !isAvailable && "cursor-not-allowed opacity-50"
      )}
      type="button"
      onClick={() => {
        if (isAvailable && onClick) {
          onClick()
        }
      }}
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

          <p className="text-muted-foreground mt-2 text-xs">By {creator_id}</p>
        </div>
      </div>
    </button>
  )
}
