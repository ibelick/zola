"use client"

import { Agent } from "@/app/types/agent"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { useAgent } from "@/lib/agent-store/hooks"
import { MODELS_OPTIONS } from "@/lib/config"
import { ArrowUp, Stop, Warning } from "@phosphor-icons/react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { PromptSystem } from "../suggestions/prompt-system"
import { AgentCommand } from "./agent-command"
import { ButtonFileUpload } from "./button-file-upload"
import { FileList } from "./file-list"
import { SelectModel } from "./select-model"
import { SelectedAgent } from "./selected-agent"

// Mock agents for testing - remove or replace with actual data source
const BASE_AGENTS: Agent[] = [
  {
    id: "agent-linear",
    name: "Linear",
    slug: "linear",
    avatar_url: null,
    creator_id: "system",
    category: "product",
    is_public: true,
    remixable: true,
    model_preference: null,
    tags: ["product", "planning", "clean-ui"],
    description:
      "Create issues, structure roadmaps, and plan product sprints. Built for fast, focused teams",
    system_prompt:
      "You are a precise product assistant. When given context, you generate clear, structured tasks and product docs. Always suggest the next concrete step and format outputs for async work.",
    example_inputs: [
      "Plan a sprint for Q2",
      "Create tasks from this meeting summary",
    ],
    tools: null,
    max_steps: null,
    tools_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    mcp_config: null,
  },
]

const LIST_OF_AGENTS = Array.from({ length: 10 }, (_, index) => ({
  ...BASE_AGENTS[0],
  id: `agent-${index}`,
  slug: `agent-${index}`,
}))

const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-linear",
    name: "Linear",
    slug: "linear",
    avatar_url:
      "https://cdn.brandfetch.io/iduDa181eM/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1723620974313",
    creator_id: "system",
    category: "product",
    is_public: true,
    remixable: true,
    model_preference: null,
    tags: ["product", "planning", "clean-ui"],
    description:
      "Create issues, structure roadmaps, and plan product sprints. Built for fast, focused teams",
    system_prompt:
      "You are a precise product assistant. When given context, you generate clear, structured tasks and product docs. Always suggest the next concrete step and format outputs for async work.",
    example_inputs: [
      "Plan a sprint for Q2",
      "Create tasks from this meeting summary",
    ],
    tools: null,
    max_steps: null,
    tools_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: null,
    mcp_config: null,
  },
  ...LIST_OF_AGENTS,
]

type ChatInputProps = {
  value: string
  onValueChange: (value: string) => void
  onSend: () => void
  isSubmitting?: boolean
  hasMessages?: boolean
  files: File[]
  onFileUpload: (files: File[]) => void
  onFileRemove: (file: File) => void
  onSuggestion: (suggestion: string) => void
  hasSuggestions?: boolean
  onSelectModel: (model: string) => void
  selectedModel: string
  isUserAuthenticated: boolean
  systemPrompt?: string
  stop: () => void
  status?: "submitted" | "streaming" | "ready" | "error"
  placeholder?: string
}

export function ChatInput({
  value,
  onValueChange,
  onSend,
  isSubmitting,
  files,
  onFileUpload,
  onFileRemove,
  onSuggestion,
  hasSuggestions,
  onSelectModel,
  selectedModel,
  isUserAuthenticated,
  stop,
  status,
  placeholder,
}: ChatInputProps) {
  const { agent } = useAgent()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Agent command state
  const [showAgentCommand, setShowAgentCommand] = useState(false)
  const [agentSearchTerm, setAgentSearchTerm] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const mentionStartPosRef = useRef<number | null>(null)
  const [activeAgentIndex, setActiveAgentIndex] = useState(0)
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)

  const selectModelConfig = MODELS_OPTIONS.find(
    (model) => model.id === selectedModel
  )
  const noToolSupport = selectModelConfig?.features?.some(
    (feature) => feature.id === "tool-use" && !feature.enabled
  )

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

  // Handle agent command detection directly in the onValueChange handler
  const handleValueChange = (newValue: string) => {
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
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSubmitting) {
        e.preventDefault()
        return
      }

      if (e.key === "Enter" && status === "streaming") {
        e.preventDefault()
        return
      }

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

      if (e.key === "Enter" && !e.shiftKey && !showAgentCommand) {
        e.preventDefault()
        onSend()
      }

      // If '@' is typed, show the agent command
      if (e.key === "@") {
        mentionStartPosRef.current = textareaRef.current?.selectionStart || null
      }
    },
    [
      onSend,
      isSubmitting,
      showAgentCommand,
      filteredAgents,
      activeAgentIndex,
      status,
    ]
  )

  const handleMainClick = () => {
    if (isSubmitting) {
      return
    }

    if (status === "streaming") {
      stop()
      return
    }

    onSend()
  }

  const handleAgentSelect = (agent: Agent) => {
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
  }

  const removeSelectedAgent = () => {
    setSelectedAgent(null)
  }

  const closeAgentCommand = useCallback(() => {
    setShowAgentCommand(false)
    textareaRef.current?.focus()
  }, [])

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const hasImageContent = Array.from(items).some((item) =>
        item.type.startsWith("image/")
      )

      if (!isUserAuthenticated && hasImageContent) {
        e.preventDefault()
        return
      }

      if (isUserAuthenticated && hasImageContent) {
        const imageFiles: File[] = []

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
              const newFile = new File(
                [file],
                `pasted-image-${Date.now()}.${file.type.split("/")[1]}`,
                { type: file.type }
              )
              imageFiles.push(newFile)
            }
          }
        }

        if (imageFiles.length > 0) {
          onFileUpload(imageFiles)
        }
      }
      // Text pasting will work by default for everyone
    },
    [isUserAuthenticated, onFileUpload]
  )

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.addEventListener("paste", handlePaste)
    return () => el.removeEventListener("paste", handlePaste)
  }, [handlePaste])

  return (
    <div className="relative flex w-full flex-col gap-4">
      {hasSuggestions && (
        <PromptSystem
          onValueChange={onValueChange}
          onSuggestion={onSuggestion}
          value={value}
        />
      )}
      <div className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1">
        <PromptInput
          className="bg-popover relative z-10 overflow-hidden p-0 pb-2 shadow-xs backdrop-blur-xl"
          maxHeight={200}
          value={value}
          onValueChange={handleValueChange}
        >
          {showAgentCommand && (
            <div className="absolute bottom-full left-0 w-full">
              <AgentCommand
                isOpen={showAgentCommand}
                searchTerm={agentSearchTerm}
                onSelect={handleAgentSelect}
                onClose={closeAgentCommand}
                activeIndex={activeAgentIndex}
                onActiveIndexChange={setActiveAgentIndex}
                agents={agents}
              />
            </div>
          )}
          <SelectedAgent
            selectedAgent={selectedAgent}
            removeSelectedAgent={removeSelectedAgent}
          />
          <FileList files={files} onFileRemove={onFileRemove} />
          <PromptInputTextarea
            placeholder={placeholder || "Ask Zola or @mention an agent"}
            onKeyDown={handleKeyDown}
            className="mt-2 ml-2 min-h-[44px] text-base leading-[1.3] sm:text-base md:text-base"
            ref={textareaRef}
          />
          <PromptInputActions className="mt-5 w-full justify-between px-2">
            <div className="flex gap-2">
              <ButtonFileUpload
                onFileUpload={onFileUpload}
                isUserAuthenticated={isUserAuthenticated}
                model={selectedModel}
              />
              <SelectModel
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                isUserAuthenticated={isUserAuthenticated}
              />
              {agent && noToolSupport && (
                <div className="flex items-center gap-1">
                  <Warning className="size-4" />
                  <p className="line-clamp-2 text-xs">
                    {selectedModel} does not support tools. Agents may not work
                    as expected.
                  </p>
                </div>
              )}
            </div>
            <PromptInputAction
              tooltip={status === "streaming" ? "Stop" : "Send"}
            >
              <Button
                size="sm"
                className="size-9 rounded-full transition-all duration-300 ease-out"
                disabled={!value || isSubmitting}
                type="button"
                onClick={handleMainClick}
                aria-label={status === "streaming" ? "Stop" : "Send message"}
              >
                {status === "streaming" ? (
                  <Stop className="size-4" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  )
}
