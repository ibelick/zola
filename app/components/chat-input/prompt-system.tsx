"use client"

import type { AgentsSuggestions } from "@/app/types/agent"
import { ZOLA_AGENTS_SLUGS } from "@/lib/config"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import React, { memo, useEffect, useMemo, useState } from "react"
import { Agents } from "./agents"
import { Suggestions } from "./suggestions"

type PromptSystemProps = {
  onValueChange: (value: string) => void
  onSuggestion: (suggestion: string) => void
  onSelectSystemPrompt: (systemPrompt: string) => void
  value: string
  setSelectedAgentId: (agentId: string | null) => void
  selectedAgentId: string | null
}

export const PromptSystem = memo(function PromptSystem({
  onValueChange,
  onSuggestion,
  onSelectSystemPrompt,
  value,
  setSelectedAgentId,
  selectedAgentId,
}: PromptSystemProps) {
  const [isAgentMode, setIsAgentMode] = useState(false)
  const [sugestedAgents, setSugestedAgents] = useState<
    AgentsSuggestions[] | null
  >(null)

  useEffect(() => {
    const fetchAgents = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, description, avatar_url")
        .in("slug", ZOLA_AGENTS_SLUGS)

      if (error) {
        throw new Error("Error fetching agents: " + error.message)
      }

      const randomAgents = data
        ?.sort(() => Math.random() - 0.5)
        .slice(0, 8) as AgentsSuggestions[]

      setSugestedAgents(randomAgents)
    }
    fetchAgents()
  }, [])

  const tabs = useMemo(
    () => [
      {
        id: "agents",
        label: "Agents",
        isActive: isAgentMode,
        onClick: () => {
          setIsAgentMode(true)
          onSelectSystemPrompt("")
          setSelectedAgentId(null)
        },
      },
      {
        id: "suggestions",
        label: "Suggestions",
        isActive: !isAgentMode,
        onClick: () => {
          setIsAgentMode(false)
          onSelectSystemPrompt("")
          setSelectedAgentId(null)
        },
      },
    ],
    [isAgentMode]
  )

  return (
    <>
      <div className="relative order-1 w-full md:absolute md:bottom-[-70px] md:order-2 md:h-[70px]">
        <AnimatePresence mode="popLayout">
          {isAgentMode ? (
            <Agents
              setSelectedAgentId={setSelectedAgentId}
              selectedAgentId={selectedAgentId}
              sugestedAgents={sugestedAgents || []}
            />
          ) : (
            <Suggestions
              onValueChange={onValueChange}
              onSuggestion={onSuggestion}
              value={value}
            />
          )}
        </AnimatePresence>
      </div>
      <div className="relative right-0 bottom-0 left-0 mx-auto mb-4 flex h-8 w-auto items-center justify-center rounded-lg p-1 md:fixed md:bottom-0">
        <div className="relative flex h-full flex-row gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "relative z-10 flex h-full flex-1 items-center justify-center rounded-md px-2 py-1 text-xs font-medium transition-colors active:scale-[0.98]",
                !tab.isActive ? "text-muted-foreground" : "text-foreground"
              )}
              onClick={tab.onClick}
              type="button"
            >
              <AnimatePresence initial={false}>
                {tab.isActive && (
                  <motion.div
                    layoutId={`background`}
                    className={cn("bg-muted absolute inset-0 z-10 rounded-lg")}
                    transition={{
                      duration: 0.25,
                      type: "spring",
                      bounce: 0,
                    }}
                    initial={{ opacity: 1 }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    style={{
                      originY: "0px",
                    }}
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
})
