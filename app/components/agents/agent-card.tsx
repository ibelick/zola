import { Tables } from "@/app/types/database.types"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type AgentCardProps = {
  id: string
  name: string
  description: string
  avatar_url?: string | null
  className?: string
  isAvailable: boolean
  onClick?: () => void
  system_prompt?: string
  tools?: string[] | null
  mcp_config?: Tables<"agents">["mcp_config"] | null
  isLight?: boolean
}

export function AgentCard({
  name,
  description,
  avatar_url,
  className,
  isAvailable,
  onClick,
  system_prompt,
  tools,
  mcp_config,
  isLight = false,
}: AgentCardProps) {
  return (
    <button
      className={cn(
        "flex items-start justify-start",
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
      <div className="flex flex-col items-start space-y-2">
        <div className="flex items-center space-x-2">
          {avatar_url ? (
            <div className="bg-muted size-4 overflow-hidden rounded-full">
              <Avatar className="h-full w-full object-cover">
                <AvatarImage
                  src={avatar_url}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              </Avatar>
            </div>
          ) : null}
          <h3 className="text-foreground text-base font-medium">{name}</h3>
        </div>

        <p className="text-foreground line-clamp-2 text-left text-sm">
          {description}
        </p>

        {!isLight && system_prompt && (
          <p className="text-muted-foreground line-clamp-2 text-left font-mono text-sm">
            {system_prompt}
          </p>
        )}

        {!isLight && (
          <div className="flex flex-wrap gap-2 text-xs">
            {tools && tools.length > 0 ? (
              <span className="text-muted-foreground">
                tools: {tools.join(", ")}
              </span>
            ) : mcp_config ? (
              <span className="text-muted-foreground">
                mcp: {mcp_config.server}
              </span>
            ) : (
              <span className="text-muted-foreground">tools: none</span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
