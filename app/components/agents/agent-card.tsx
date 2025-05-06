import { useUser } from "@/app/providers/user-provider"
import { AgentSummary } from "@/app/types/agent"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { User } from "@phosphor-icons/react"

type AgentCardProps = {
  id: string
  name: string
  description: string
  avatar_url?: string | null
  creator_id?: string
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
      onClick={(e) => {
        e.preventDefault()

        if (!isAvailable) return

        onClick?.()
      }}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="bg-muted size-16 overflow-hidden rounded-full">
            {avatar_url ? (
              <Avatar className="h-full w-full object-cover">
                <AvatarImage
                  src={avatar_url}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              </Avatar>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-left">
          <h3 className="text-foreground truncate text-base font-medium">
            {name}
          </h3>

          <p className="text-foreground line-clamp-3 text-sm md:line-clamp-2">
            {description}
          </p>

          {creator_id && (
            <p className="text-muted-foreground mt-2 text-xs">
              By {creator_id}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
