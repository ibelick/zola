"use client"

import { Agent } from "@/app/types/agent"
import { useCallback, useEffect, useRef, useState } from "react"

type UseAgentCommandProps = {
  value: string
  onValueChange: (value: string) => void
  agents: Agent[]
}

type UseAgentCommandReturn = {
  showAgentCommand: boolean
  agentSearchTerm: string
  selectedAgent: Agent | null
  activeAgentIndex: number
  filteredAgents: Agent[]
  mentionStartPos: number | null
  textareaRef: React.RefObject<HTMLTextAreaElement>
  handleKeyDown: (e: React.KeyboardEvent) => void
  handleValueChange: (newValue: string) => void
  handleAgentSelect: (agent: Agent) => void
  removeSelectedAgent: () => void
  closeAgentCommand: () => void
  setActiveAgentIndex: (index: number) => void
}

export function useAgentCommand({
  value,
  onValueChange,
  agents,
}: UseAgentCommandProps): UseAgentCommandReturn {
  // State for agent command UI
  const [showAgentCommand, setShowAgentCommand] = useState(false)
  const [agentSearchTerm, setAgentSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const mentionStartPosRef = useRef<number | null>(null)
  const [activeAgentIndex, setActiveAgentIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Filter agents based on search term
  const filteredAgents = agentSearchTerm
    ? agents.filter((agent) =>
        agent.name.toLowerCase().includes(agentSearchTerm.toLowerCase())
      )
    : agents

  // Reset active index when filtered agents change
  useEffect(() => {
    setActiveAgentIndex(0)
  }, [filteredAgents.length])

  // Enhanced value change handler for detecting @ mentions
  const handleValueChange = useCallback(
    (newValue: string) => {
      // Call the original onValueChange
      onValueChange(newValue)

      // Check for @ character
      if (newValue.includes("@")) {
        const match = newValue.match(/@([^@\s]*)$/)
        console.log("@ detected in handleValueChange, match:", match)

        if (match) {
          setShowAgentCommand(true)
          setAgentSearchTerm(match[1] || "")

          // Store position for replacement later
          if (mentionStartPosRef.current === null && textareaRef.current) {
            const atIndex = newValue.lastIndexOf("@" + match[1])
            if (atIndex !== -1) {
              mentionStartPosRef.current = atIndex
            }
          }
        }
      } else {
        setShowAgentCommand(false)
        setAgentSearchTerm("")
        mentionStartPosRef.current = null
      }
    },
    [onValueChange]
  )

  // Handle keyboard navigation for agent command
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle keyboard navigation for agent command
      if (showAgentCommand && filteredAgents.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setActiveAgentIndex((prev) =>
            prev < filteredAgents.length - 1 ? prev + 1 : 0
          )
          return
        }

        if (e.key === "ArrowUp") {
          e.preventDefault()
          setActiveAgentIndex((prev) =>
            prev > 0 ? prev - 1 : filteredAgents.length - 1
          )
          return
        }

        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          const selectedAgent = filteredAgents[activeAgentIndex]
          if (selectedAgent) {
            handleAgentSelect(selectedAgent)
          }
          return
        }

        if (e.key === "Escape") {
          e.preventDefault()
          setShowAgentCommand(false)
          return
        }

        if (e.key === "Tab") {
          e.preventDefault()
          return
        }
      }

      // If '@' is typed, show the agent command
      if (e.key === "@") {
        mentionStartPosRef.current = textareaRef.current?.selectionStart || null
      }
    },
    [showAgentCommand, filteredAgents, activeAgentIndex]
  )

  // Handle agent selection
  const handleAgentSelect = useCallback(
    (agent: Agent) => {
      setSelectedAgent(agent)

      // Remove the @searchterm from the input
      if (mentionStartPosRef.current !== null) {
        const beforeMention = value.substring(0, mentionStartPosRef.current)
        const afterMention = value
          .substring(mentionStartPosRef.current)
          .replace(/@([^@\s]*)/, "")
        onValueChange(beforeMention + afterMention)
      } else {
        const newValue = value.replace(/@([^@\s]*)$/, "")
        onValueChange(newValue)
      }

      mentionStartPosRef.current = null
      setShowAgentCommand(false)

      // Focus back on textarea after selection
      textareaRef.current?.focus()
    },
    [value, onValueChange]
  )

  // Remove selected agent
  const removeSelectedAgent = useCallback(() => {
    setSelectedAgent(null)
  }, [])

  // Close the agent command menu
  const closeAgentCommand = useCallback(() => {
    setShowAgentCommand(false)
    textareaRef.current?.focus()
  }, [])

  return {
    showAgentCommand,
    agentSearchTerm,
    selectedAgent,
    activeAgentIndex,
    filteredAgents,
    mentionStartPos: mentionStartPosRef.current,
    textareaRef: textareaRef as React.RefObject<HTMLTextAreaElement>,
    handleKeyDown,
    handleValueChange,
    handleAgentSelect,
    removeSelectedAgent,
    closeAgentCommand,
    setActiveAgentIndex,
  }
}
