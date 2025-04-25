import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { AgentHeader } from "./header"

type HeaderAgentProps = {
  agent?: AgentHeader | null
}

export function HeaderAgent({ agent }: HeaderAgentProps) {
  const isMobile = useBreakpoint(768)
  const initials = agent?.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  return (
    <AnimatePresence mode="wait">
      {agent && (
        <motion.div
          key={agent.slug}
          initial={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
          transition={{
            duration: 0.15,
            ease: "easeOut",
          }}
          className="bg-background/40 flex items-center justify-center gap-2 rounded-t-none rounded-b-md px-0 py-0 backdrop-blur-2xl md:px-3 md:py-3"
        >
          <Avatar className="size-10">
            <AvatarImage
              src={agent?.avatar_url || ""}
              alt={agent.name}
              className="object-cover"
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex items-center">
            <h2 className="text-sm font-medium">{agent.name}</h2>
            {!isMobile && agent.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground ml-1.5 transition-colors">
                      <Info className="size-4" />
                      <span className="sr-only">User information</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{agent.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
