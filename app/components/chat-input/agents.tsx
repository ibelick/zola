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
import { useRouter, useSearchParams } from "next/navigation"
import { memo, useState } from "react"

type ButtonAgentProps = {
  label: string
  avatarUrl: string
  description: string
  slug: string
  isActive: boolean
  onSelect: (slug: string) => void
}

const ButtonAgent = memo(function ButtonAgent({
  label,
  avatarUrl,
  description,
  slug,
  isActive,
  onSelect,
}: ButtonAgentProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          key={label}
          variant="outline"
          size="lg"
          onClick={() => onSelect(slug)}
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
  sugestedAgents: AgentsSuggestions[]
}

export const Agents = memo(function Agents({ sugestedAgents }: AgentsProps) {
  const router = useRouter()
  const params = useSearchParams()
  const agentSlug = params.get("agent")
  const [selectedAgent, setSelectedAgent] = useState<string | null>(agentSlug)

  const handleAgentSelect = (slug: string) => {
    const newSelectedAgent = selectedAgent === slug ? null : slug
    setSelectedAgent(newSelectedAgent)

    if (newSelectedAgent) {
      router.push(`/?agent=${newSelectedAgent}`)
    } else {
      router.push(`/`)
    }
  }

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
            avatarUrl={agent.avatar_url || ""}
            slug={agent.slug}
            description={agent.description || ""}
            isActive={selectedAgent === agent.slug}
            onSelect={handleAgentSelect}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})
