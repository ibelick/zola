"use client"

import { AgentSummary } from "@/app/types/agent"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TRANSITION_SUGGESTIONS } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { memo } from "react"

type ButtonAgentProps = {
  label: string
  prompt: string
  onSelectSystemPrompt: (systemPrompt: string) => void
  systemPrompt?: string
  avatarUrl: string
}

const ButtonAgent = memo(function ButtonAgent({
  label,
  prompt,
  onSelectSystemPrompt,
  systemPrompt,
  avatarUrl,
}: ButtonAgentProps) {
  const isActive = systemPrompt === prompt

  return (
    <Button
      key={label}
      variant="outline"
      size="lg"
      onClick={() =>
        isActive ? onSelectSystemPrompt("") : onSelectSystemPrompt(prompt)
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
  )
})

type AgentsProps = {
  onSelectSystemPrompt: (systemPrompt: string) => void
  systemPrompt?: string
  sugestedAgents: AgentSummary[]
}

export const Agents = memo(function Agents({
  onSelectSystemPrompt,
  systemPrompt,
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
            prompt={agent.description}
            onSelectSystemPrompt={onSelectSystemPrompt}
            systemPrompt={systemPrompt}
            avatarUrl={agent.avatar_url || ""}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})
