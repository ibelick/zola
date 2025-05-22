"use client"

import { useChatSession } from "@/app/providers/chat-session-provider"
import { useUser } from "@/app/providers/user-provider"
import { Agent } from "@/app/types/agent"
import { useChats } from "@/lib/chat-store/chats/provider"
import { debounce } from "@/lib/utils"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

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

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(defaultAgent)
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

  // Sync with defaultAgent always (no localOverride anymore)
  useEffect(() => {
    setSelectedAgent(defaultAgent ?? null)
  }, [defaultAgent])

  // Remove selected agent on root
  useEffect(() => {
    if (pathname === "/") setSelectedAgent(null)
  }, [pathname])

  const updateAgentInUrl = useCallback(
    (agent: Agent | null) => {
      if (!searchParams) return

      const params = new URLSearchParams(searchParams.toString())
      agent ? params.set("agent", agent.slug) : params.delete("agent")
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const updateChatAgentDebounced = useCallback(
    debounce((agent: Agent | null) => {
      if (!user || !chatId) return
      updateChatAgent(user.id, chatId, agent?.id ?? null, !user.anonymous)
    }, 500),
    [chatId, user, updateChatAgent]
  )

  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange(newValue)
      const match = newValue.match(/@([^@\s]*)$/)
      if (match) {
        setShowAgentCommand(true)
        setAgentSearchTerm(match[1])
        if (mentionStartPosRef.current === null && textareaRef.current) {
          const atIndex = newValue.lastIndexOf("@" + match[1])
          mentionStartPosRef.current = atIndex
        }
      } else {
        setShowAgentCommand(false)
        setAgentSearchTerm("")
        mentionStartPosRef.current = null
      }
    },
    [onValueChange]
  )

  const handleAgentSelect = useCallback(
    (agent: Agent) => {
      setSelectedAgent(agent)
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

      if (["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(e.key))
        e.preventDefault()

      if (e.key === "ArrowDown")
        setActiveAgentIndex((i) => (i + 1) % filteredAgents.length)
      if (e.key === "ArrowUp")
        setActiveAgentIndex(
          (i) => (i - 1 + filteredAgents.length) % filteredAgents.length
        )
      if (e.key === "Enter") handleAgentSelect(filteredAgents[activeAgentIndex])
      if (e.key === "Escape") setShowAgentCommand(false)
    },
    [showAgentCommand, filteredAgents, activeAgentIndex, handleAgentSelect]
  )

  const removeSelectedAgent = useCallback(() => {
    setSelectedAgent(null)
    updateAgentInUrl(null)
    if (user?.id && chatId) {
      updateChatAgent(user.id, chatId, null, !user.anonymous).catch(
        console.error
      )
    }
    textareaRef.current?.focus()
  }, [updateAgentInUrl, user, chatId, updateChatAgent])

  useEffect(() => setActiveAgentIndex(0), [filteredAgents.length])

  return {
    showAgentCommand,
    agentSearchTerm,
    selectedAgent,
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
