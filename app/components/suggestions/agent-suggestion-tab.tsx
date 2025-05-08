"use client"

import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import React, { useMemo } from "react"

type AgentSuggestionTabProps = {
  isAgentMode: boolean
  setIsAgentMode: (isAgentMode: boolean) => void
  onSelectSystemPrompt: (systemPrompt: string) => void
}

export function AgentSuggestionTab({
  isAgentMode,
  setIsAgentMode,
  onSelectSystemPrompt,
}: AgentSuggestionTabProps) {
  const router = useRouter()

  const tabs = useMemo(
    () => [
      {
        id: "agents",
        label: "Agents",
        isActive: isAgentMode,
        onClick: () => {
          setIsAgentMode(true)
          onSelectSystemPrompt("")
          router.push("/")
        },
      },
      {
        id: "suggestions",
        label: "Suggestions",
        isActive: !isAgentMode,
        onClick: () => {
          setIsAgentMode(false)
          onSelectSystemPrompt("")
          router.push("/")
        },
      },
    ],
    [isAgentMode]
  )

  return (
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
  )
}
