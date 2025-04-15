import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UsersThree } from "@phosphor-icons/react"
import Link from "next/link"

export function AgentLink() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/agents"
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1.5 transition-colors"
          prefetch
        >
          <UsersThree className="text-muted-foreground" size={24} />
        </Link>
      </TooltipTrigger>
      <TooltipContent>Agents</TooltipContent>
    </Tooltip>
  )
}
