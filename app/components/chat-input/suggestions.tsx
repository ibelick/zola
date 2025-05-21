"use client"

import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion"
import { TRANSITION_SUGGESTIONS } from "@/lib/motion"
import { AnimatePresence, motion } from "motion/react"
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { SUGGESTIONS as SUGGESTIONS_CONFIG } from "../../../lib/config"

const MotionPromptSuggestion = motion.create(PromptSuggestion)

type SuggestionsProps = {
  onValueChange: (value: string) => void
  onSuggestion: (suggestion: string) => void
  value?: string
}

export const Suggestions = memo(function Suggestions({
  onValueChange,
  onSuggestion,
  value,
}: SuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  // Use refs to maintain stable function references
  const valueChangeRef = useRef(onValueChange)
  const suggestionRef = useRef(onSuggestion)

  // Update refs when props change
  useEffect(() => {
    valueChangeRef.current = onValueChange
    suggestionRef.current = onSuggestion
  }, [onValueChange, onSuggestion])

  const activeCategoryData = SUGGESTIONS_CONFIG.find(
    (group) => group.label === activeCategory
  )

  const showCategorySuggestions =
    activeCategoryData && activeCategoryData.items.length > 0

  useEffect(() => {
    if (!value) {
      setActiveCategory(null)
    }
  }, [value])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setActiveCategory(null)
    suggestionRef.current(suggestion)
    valueChangeRef.current("")
  }, [])

  const handleCategoryClick = useCallback(
    (suggestion: { label: string; prompt: string }) => {
      setActiveCategory(suggestion.label)
      valueChangeRef.current(suggestion.prompt)
    },
    []
  )

  // Render the grid once and cache it
  const suggestionsGrid = useMemo(
    () => (
      <motion.div
        key="suggestions-grid"
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
        style={{ scrollbarWidth: "none" }}
      >
        {SUGGESTIONS_CONFIG.map((suggestion, index) => (
          <MotionPromptSuggestion
            key={suggestion.label}
            onClick={() => handleCategoryClick(suggestion)}
            className="capitalize"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.8 },
            }}
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.02,
            }}
          >
            <suggestion.icon className="size-4" />
            {suggestion.label}
          </MotionPromptSuggestion>
        ))}
      </motion.div>
    ),
    [handleCategoryClick]
  )

  const suggestionsList = useMemo(() => {
    if (!activeCategoryData) return null

    return (
      <motion.div
        className="flex w-full flex-col space-y-1 px-2"
        key="suggestions-list"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { opacity: 0, y: 10, filter: "blur(4px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          exit: { opacity: 0, y: -10, filter: "blur(4px)" },
        }}
        transition={TRANSITION_SUGGESTIONS}
      >
        {activeCategoryData.items.map((suggestion: string, index: number) => (
          <MotionPromptSuggestion
            key={`${activeCategory}-${suggestion}`}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className="block h-full text-left"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: { opacity: 0, y: -10 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 10 },
            }}
            transition={{
              ...TRANSITION_SUGGESTIONS,
              delay: index * 0.05,
            }}
          >
            {suggestion}
          </MotionPromptSuggestion>
        ))}
      </motion.div>
    )
  }, [activeCategoryData, activeCategory, handleSuggestionClick])

  return (
    <div className="suggestions-container">
      <AnimatePresence mode="wait">
        {showCategorySuggestions ? suggestionsList : suggestionsGrid}
      </AnimatePresence>
    </div>
  )
})
