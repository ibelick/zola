import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Info } from "@phosphor-icons/react"

type HeaderAgentProps = {
  avatarUrl: string
  name: string
  info: string
  className?: string
}

export function HeaderAgent({
  avatarUrl,
  name,
  info,
  className,
}: HeaderAgentProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <div
      className={cn(
        "bg-background/40 flex items-center justify-center gap-2 rounded-t-none rounded-b-md px-0 py-0 backdrop-blur-2xl md:px-3 md:py-3",
        className
      )}
    >
      <Avatar className="size-10">
        <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex items-center">
        <h2 className="text-sm font-medium">{name}</h2>
        {info && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground ml-1.5 transition-colors">
                  <Info className="size-4" />
                  <span className="sr-only">User information</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
