import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { UsersThree } from "@phosphor-icons/react"
import Link from "next/link"

export function AgentLink() {
  if (!isSupabaseEnabled) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/agents"
          className="text-muted-foreground hover:text-foreground hover:bg-muted bg-background rounded-full p-1.5 transition-colors"
          prefetch
          aria-label="Agents"
        >
          <UsersThree size={24} />
        </Link>
      </TooltipTrigger>
      <TooltipContent>Agents</TooltipContent>
    </Tooltip>
  )
}
