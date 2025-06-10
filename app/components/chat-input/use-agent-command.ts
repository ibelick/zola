"use client"

import { Agent } from "@/app/types/agent"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { useUser } from "@/lib/user-store/provider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useRef, useState } from "react"

export function useAgentCommand({
  value,
  onValueChange,
  agents,
  defaultAgent = null,
}: {
  value: string
  onValueChange: (value: string) => void
  agents: Agent[]
  defaultAgent?: Agent | null
}) {
  const searchParams = useSearchParams()
  const { chatId } = useChatSession()
  const { user } = useUser()
  const { updateChatAgent } = useChats()

  const pathname = usePathname()
  const router = useRouter()

  // Track if user has explicitly removed the agent (optimistic state)
  const [hasExplicitlyRemovedAgent, setHasExplicitlyRemovedAgent] =
    useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentCommand, setShowAgentCommand] = useState(false)
  const [agentSearchTerm, setAgentSearchTerm] = useState("")
  const [activeAgentIndex, setActiveAgentIndex] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const mentionStartPosRef = useRef<number | null>(null)

  const filteredAgents = agentSearchTerm
    ? agents.filter((a) =>
        a.name.toLowerCase().includes(agentSearchTerm.toLowerCase())
      )
    : agents

  // Determine the effective selected agent
  const effectiveSelectedAgent = (() => {
    // If user explicitly removed agent, respect that (optimistic)
    if (hasExplicitlyRemovedAgent) return null

    // If user selected an agent explicitly, use that
    if (selectedAgent) return selectedAgent

    // Otherwise fall back to defaultAgent (from URL/chat)
    return defaultAgent
  })()

  // Sync selectedAgent when defaultAgent changes (when URL agent loads)
  // This handles the case where defaultAgent starts as null and then gets populated
  if (defaultAgent && !selectedAgent && !hasExplicitlyRemovedAgent) {
    setSelectedAgent(defaultAgent)
  }

  // Reset explicit removal flag when defaultAgent changes
  if (
    defaultAgent &&
    hasExplicitlyRemovedAgent &&
    defaultAgent.id !== selectedAgent?.id
  ) {
    setHasExplicitlyRemovedAgent(false)
  }

  const updateAgentInUrl = useCallback(
    (agent: Agent | null) => {
      if (!searchParams) return

      const params = new URLSearchParams(searchParams.toString())
      if (agent) {
        params.set("agent", agent.slug)
      } else {
        params.delete("agent")
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const updateChatAgentDebounced = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null

    return (agent: Agent | null) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        if (!user || !chatId) return
        updateChatAgent(user.id, chatId, agent?.id ?? null, !user.anonymous)
      }, 500)
    }
  }, [chatId, user, updateChatAgent])

  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange(newValue)
      const match = newValue.match(/@([^@\s]*)$/)
      if (match) {
        const newSearchTerm = match[1]
        const wasSearchTermDifferent = agentSearchTerm !== newSearchTerm

        setShowAgentCommand(true)
        setAgentSearchTerm(newSearchTerm)

        // Reset active index when search term changes
        if (wasSearchTermDifferent) {
          setActiveAgentIndex(0)
        }

        if (mentionStartPosRef.current === null && textareaRef.current) {
          const atIndex = newValue.lastIndexOf("@" + match[1])
          mentionStartPosRef.current = atIndex
        }
      } else {
        setShowAgentCommand(false)
        setAgentSearchTerm("")
        mentionStartPosRef.current = null
        setActiveAgentIndex(0)
      }
    },
    [onValueChange, agentSearchTerm]
  )

  const handleAgentSelect = useCallback(
    (agent: Agent) => {
      // Optimistic update: set state immediately
      setSelectedAgent(agent)
      setHasExplicitlyRemovedAgent(false)

      // Then update URL and API
      updateAgentInUrl(agent)
      updateChatAgentDebounced(agent)

      const start = mentionStartPosRef.current
      const text = value.replace(/@([^@\s]*)$/, "")
      onValueChange(
        start !== null ? value.slice(0, start) + text.slice(start) : text
      )

      setShowAgentCommand(false)
      mentionStartPosRef.current = null
      textareaRef.current?.focus()
    },
    [value, onValueChange, updateAgentInUrl, updateChatAgentDebounced]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showAgentCommand || !filteredAgents.length) return

      if (["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === "ArrowDown") {
        setActiveAgentIndex((i) => (i + 1) % filteredAgents.length)
      }
      if (e.key === "ArrowUp") {
        setActiveAgentIndex(
          (i) => (i - 1 + filteredAgents.length) % filteredAgents.length
        )
      }
      if (e.key === "Enter") {
        handleAgentSelect(filteredAgents[activeAgentIndex])
      }
      if (e.key === "Escape") {
        setShowAgentCommand(false)
      }
    },
    [showAgentCommand, filteredAgents, activeAgentIndex, handleAgentSelect]
  )

  const removeSelectedAgent = useCallback(() => {
    // Optimistic update: immediately update UI state
    setSelectedAgent(null)
    setHasExplicitlyRemovedAgent(true)

    // Then update URL and API (non-blocking)
    updateAgentInUrl(null)
    if (user?.id && chatId) {
      updateChatAgent(user.id, chatId, null, !user.anonymous).catch(
        console.error
      )
    }
    textareaRef.current?.focus()
  }, [updateAgentInUrl, user, chatId, updateChatAgent])

  return {
    showAgentCommand,
    agentSearchTerm,
    selectedAgent: effectiveSelectedAgent,
    activeAgentIndex,
    filteredAgents,
    mentionStartPos: mentionStartPosRef.current,
    textareaRef,
    handleKeyDown,
    handleValueChange,
    handleAgentSelect,
    removeSelectedAgent,
    closeAgentCommand: () => setShowAgentCommand(false),
    setActiveAgentIndex,
  }
}
