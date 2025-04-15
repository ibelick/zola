"use client"

import type { AgentsSuggestions } from "@/app/types/agent"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { TRANSITION_SUGGESTIONS } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { memo } from "react"

type ButtonAgentProps = {
  label: string
  setSelectedAgentId: (agentId: string | null) => void
  selectedAgentId: string | null
  avatarUrl: string
  id: string
  description: string
}

const ButtonAgent = memo(function ButtonAgent({
  label,
  setSelectedAgentId,
  selectedAgentId,
  avatarUrl,
  description,
  id,
}: ButtonAgentProps) {
  const isActive = selectedAgentId === id

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          key={label}
          variant="outline"
          size="lg"
          onClick={() =>
            isActive ? setSelectedAgentId(null) : setSelectedAgentId(id)
          }
          className={cn(
            "rounded-full px-2.5",
            isActive &&
              "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground transition-none"
          )}
          type="button"
        >
          <Avatar className="size-6">
            <AvatarImage src={avatarUrl} className="size-6 object-cover" />
            <AvatarFallback>{label.charAt(0)}</AvatarFallback>
          </Avatar>
          {label}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="bg-popover px-2 py-1">
        <p className="text-secondary-foreground text-sm">{description}</p>
      </HoverCardContent>
    </HoverCard>
  )
})

type AgentsProps = {
  setSelectedAgentId: (agentId: string | null) => void
  selectedAgentId: string | null
  sugestedAgents: AgentsSuggestions[]
}

export const Agents = memo(function Agents({
  setSelectedAgentId,
  selectedAgentId,
  sugestedAgents,
}: AgentsProps) {
  return (
    <motion.div
      className="flex w-full max-w-full flex-nowrap justify-start gap-2 overflow-x-auto px-2 md:mx-auto md:max-w-2xl md:flex-wrap md:justify-center md:pl-0"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0, y: 10, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -10, filter: "blur(4px)" },
      }}
      transition={TRANSITION_SUGGESTIONS}
      style={{
        scrollbarWidth: "none",
      }}
    >
      {sugestedAgents?.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            ...TRANSITION_SUGGESTIONS,
            delay: index * 0.02,
          }}
        >
          <ButtonAgent
            key={agent.id}
            label={agent.name}
            setSelectedAgentId={setSelectedAgentId}
            selectedAgentId={selectedAgentId}
            avatarUrl={agent.avatar_url || ""}
            id={agent.id}
            description={agent.description || ""}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})
