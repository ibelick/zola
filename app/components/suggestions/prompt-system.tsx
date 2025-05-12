"use client"

import type { AgentsSuggestions } from "@/app/types/agent"
import {
  ZOLA_AGENTS_SLUGS,
  ZOLA_GITHUB_AGENTS_SLUGS,
  ZOLA_SPECIAL_AGENTS_SLUGS,
} from "@/lib/config"
import { createClient } from "@/lib/supabase/client"
import { AnimatePresence } from "motion/react"
import React, { memo, useEffect, useMemo, useState } from "react"
import { Suggestions } from "../chat-input/suggestions"

type PromptSystemProps = {
  onValueChange: (value: string) => void
  onSuggestion: (suggestion: string) => void
  value: string
}

export const PromptSystem = memo(function PromptSystem({
  onValueChange,
  onSuggestion,
  value,
}: PromptSystemProps) {
  const [sugestedAgents, setSugestedAgents] = useState<
    AgentsSuggestions[] | null
  >(null)

  const AGENTS_SLUGS = useMemo(() => {
    return [
      ZOLA_AGENTS_SLUGS,
      ZOLA_GITHUB_AGENTS_SLUGS,
      ZOLA_SPECIAL_AGENTS_SLUGS,
    ].flat()
  }, [])

  useEffect(() => {
    const fetchAgents = async () => {
      const randomSlugs = [...AGENTS_SLUGS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 8)

      const supabase = createClient()
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, description, avatar_url, slug")
        .in("slug", randomSlugs)

      if (error) {
        throw new Error("Error fetching agents: " + error.message)
      }

      setSugestedAgents((data as AgentsSuggestions[]) || [])
    }
    fetchAgents()
  }, [AGENTS_SLUGS])

  return (
    <>
      <div className="relative order-1 w-full md:absolute md:bottom-[-70px] md:order-2 md:h-[70px]">
        <AnimatePresence mode="popLayout">
          <Suggestions
            onValueChange={onValueChange}
            onSuggestion={onSuggestion}
            value={value}
          />
        </AnimatePresence>
      </div>
    </>
  )
})
