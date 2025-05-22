"use client"

import {
  useAgentCommand,
  useSearchParamsWrapper,
} from "@/app/components/chat-input/use-agent-command"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { useAgent } from "@/lib/agent-store/provider"
import { MODELS_OPTIONS } from "@/lib/config"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { ArrowUp, Stop, Warning } from "@phosphor-icons/react"
import React, { Suspense, useCallback, useEffect } from "react"
import { PromptSystem } from "../suggestions/prompt-system"
import { AgentCommand } from "./agent-command"
import { ButtonFileUpload } from "./button-file-upload"
import { FileList } from "./file-list"
import { SelectModel } from "./select-model"
import { SelectedAgent } from "./selected-agent"

// Component that uses searchParams and can be wrapped in Suspense
function SearchParamsWrapper({
  value,
  onValueChange,
  agents,
  defaultAgent,
}: {
  value: string
  onValueChange: (value: string) => void
  agents: any[]
  defaultAgent: any | null
}) {
  const searchParams = useSearchParamsWrapper()

  const agentCommand = useAgentCommand({
    value,
    onValueChange,
    agents,
    defaultAgent,
    searchParams,
  })

  return (
    <AgentCommandProvider agentCommand={agentCommand}>
      {null}
    </AgentCommandProvider>
  )
}

// Create a context to pass agentCommand
const AgentCommandContext = React.createContext<ReturnType<
  typeof useAgentCommand
> | null>(null)

function AgentCommandProvider({
  children,
  agentCommand,
}: {
  children: React.ReactNode
  agentCommand: ReturnType<typeof useAgentCommand>
}) {
  return (
    <AgentCommandContext.Provider value={agentCommand}>
      {children}
    </AgentCommandContext.Provider>
  )
}

// Hook to use the agent command context
function useAgentCommandContext() {
  const context = React.useContext(AgentCommandContext)
  if (!context) {
    throw new Error(
      "useAgentCommandContext must be used within AgentCommandProvider"
    )
  }
  return context
}

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
  stop: () => void
  status?: "submitted" | "streaming" | "ready" | "error"
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
}: ChatInputProps) {
  const { currentAgent, curatedAgents, userAgents } = useAgent()

  // The actual component that renders the chat input
  function ChatInputInner() {
    const agentCommand = useAgentCommandContext()

    const selectModelConfig = MODELS_OPTIONS.find(
      (model) => model.id === selectedModel
    )
    const noToolSupport = selectModelConfig?.features?.some(
      (feature) => feature.id === "tool-use" && !feature.enabled
    )

    const handleSend = useCallback(() => {
      if (isSubmitting) {
        return
      }

      if (status === "streaming") {
        stop()
        return
      }

      onSend()
    }, [isSubmitting, onSend, status, stop])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        // First process agent command related key handling
        agentCommand.handleKeyDown(e)

        if (isSubmitting) {
          e.preventDefault()
          return
        }

        if (e.key === "Enter" && status === "streaming") {
          e.preventDefault()
          return
        }

        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          !agentCommand.showAgentCommand
        ) {
          e.preventDefault()
          onSend()
        }
      },
      [agentCommand, isSubmitting, onSend, status]
    )

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
      const el = agentCommand.textareaRef.current
      if (!el) return
      el.addEventListener("paste", handlePaste)
      return () => el.removeEventListener("paste", handlePaste)
    }, [agentCommand.textareaRef, handlePaste])

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
            className="bg-popover relative z-10 p-0 pt-1 shadow-xs backdrop-blur-xl"
            maxHeight={200}
            value={value}
            onValueChange={agentCommand.handleValueChange}
          >
            {agentCommand.showAgentCommand && (
              <div className="absolute bottom-full left-0 w-full">
                <AgentCommand
                  isOpen={agentCommand.showAgentCommand}
                  searchTerm={agentCommand.agentSearchTerm}
                  onSelect={agentCommand.handleAgentSelect}
                  onClose={agentCommand.closeAgentCommand}
                  activeIndex={agentCommand.activeAgentIndex}
                  onActiveIndexChange={agentCommand.setActiveAgentIndex}
                  curatedAgents={curatedAgents || []}
                  userAgents={userAgents || []}
                />
              </div>
            )}
            <SelectedAgent
              selectedAgent={agentCommand.selectedAgent}
              removeSelectedAgent={agentCommand.removeSelectedAgent}
            />
            <FileList files={files} onFileRemove={onFileRemove} />
            <PromptInputTextarea
              placeholder={
                isSupabaseEnabled ? "Ask Zola or @mention an agent" : "Ask Zola"
              }
              onKeyDown={handleKeyDown}
              className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
              ref={agentCommand.textareaRef}
            />
            <PromptInputActions className="mt-5 w-full justify-between px-3 pb-3">
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
                {currentAgent && noToolSupport && (
                  <div className="flex items-center gap-1">
                    <Warning className="size-4" />
                    <p className="line-clamp-2 text-xs">
                      {selectedModel} does not support tools. Agents may not
                      work as expected.
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
                  onClick={handleSend}
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

  return (
    <>
      <Suspense fallback={<div className="opacity-70">Loading input...</div>}>
        <SearchParamsWrapper
          value={value}
          onValueChange={onValueChange}
          agents={[...(curatedAgents || []), ...(userAgents || [])]}
          defaultAgent={currentAgent}
        />
      </Suspense>

      <AgentCommandProvider
        agentCommand={{
          showAgentCommand: false,
          agentSearchTerm: "",
          selectedAgent: null,
          activeAgentIndex: 0,
          filteredAgents: [],
          mentionStartPos: null,
          textareaRef: React.useRef(null),
          handleKeyDown: () => {},
          handleValueChange: onValueChange,
          handleAgentSelect: () => {},
          removeSelectedAgent: () => {},
          closeAgentCommand: () => {},
          setActiveAgentIndex: () => {},
        }}
      >
        <ChatInputInner />
      </AgentCommandProvider>
    </>
  )
}
