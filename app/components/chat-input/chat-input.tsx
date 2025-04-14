"use client"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/config"
import { ArrowUp, Stop } from "@phosphor-icons/react"
import React, { useCallback } from "react"
import { ButtonFileUpload } from "./button-file-upload"
import { FileList } from "./file-list"
import { PromptSystem } from "./prompt-system"
import { SelectModel } from "./select-model"

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
  onSelectSystemPrompt: (systemPrompt: string) => void
  systemPrompt?: string
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
  onSelectSystemPrompt,
  systemPrompt,
  stop,
  status,
}: ChatInputProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSubmitting) return

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        onSend()
      }
    },
    [onSend, isSubmitting]
  )

  const handleMainClick = () => {
    if (isSubmitting && status !== "streaming") {
      return
    }

    if (isSubmitting && status === "streaming") {
      stop()
      return
    }

    onSend()
  }

  return (
    <div className="relative flex w-full flex-col gap-4">
      {hasSuggestions && (
        <PromptSystem
          onSelectSystemPrompt={onSelectSystemPrompt}
          onValueChange={onValueChange}
          onSuggestion={onSuggestion}
          value={value}
          systemPrompt={systemPrompt}
        />
      )}
      <div className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1">
        <PromptInput
          className="border-input bg-popover relative z-10 overflow-hidden border p-0 pb-2 shadow-xs backdrop-blur-xl"
          maxHeight={200}
          value={value}
          onValueChange={onValueChange}
        >
          <FileList files={files} onFileRemove={onFileRemove} />
          <PromptInputTextarea
            placeholder={`Ask ${APP_NAME}`}
            onKeyDown={handleKeyDown}
            className="mt-2 ml-2 min-h-[44px] text-base leading-[1.3] sm:text-base md:text-base"
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
            </div>
            <PromptInputAction tooltip={isSubmitting ? "Sending..." : "Send"}>
              <Button
                size="sm"
                className="size-9 rounded-full transition-all duration-300 ease-out"
                disabled={isSubmitting || (status !== "streaming" && !value)}
                type="button"
                onClick={handleMainClick}
                aria-label="Send message"
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
