'use client'

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/prompt-kit/message"
import { cn } from "@/lib/utils"
import type { Message as MessageAISDK } from "@ai-sdk/react"
import { ArrowClockwise, Check, Copy, SpeakerHigh, StopCircle } from "@phosphor-icons/react"
import { getSources } from "./get-sources"
import { SourcesList } from "./sources-list"
import { ToolInvocation } from "./tool-invocation"
import { useSpeech } from 'react-text-to-speech'
import { Volume2 } from "lucide-react"

type MessageAssistantProps = {
  children: string
  isLast?: boolean
  hasScrollAnchor?: boolean
  copied?: boolean
  copyToClipboard?: () => void
  onReload?: () => void
  parts?: MessageAISDK["parts"]
}

export function MessageAssistant({
  children,
  isLast,
  hasScrollAnchor,
  copied,
  copyToClipboard,
  onReload,
  parts,
}: MessageAssistantProps) {
  const sources = getSources(parts)
  const toolInvocationParts = parts?.filter(
    (part) => part.type === "tool-invocation"
  )
  const contentNullOrEmpty = children === null || children === ""

  // Use react-text-to-speech for reading the message content
  const { speechStatus, start, stop } = useSpeech({ text: children })

  return (
    <Message
      className={cn(
        "group flex w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2",
        hasScrollAnchor && "min-h-scroll-anchor"
      )}
    >
      <div className={cn("flex min-w-full flex-col gap-2", isLast && "pb-8")}>
        {toolInvocationParts && toolInvocationParts.length > 0 && (
          <ToolInvocation toolInvocations={toolInvocationParts} />
        )}

        {!contentNullOrEmpty && (
          <MessageContent
            className={cn(
              "prose dark:prose-invert relative min-w-full bg-transparent p-0",
              "prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-medium prose-table:block prose-table:overflow-y-auto"
            )}
            markdown={true}
          >
            {children}
          </MessageContent>
        )}

        {sources && sources.length > 0 && <SourcesList sources={sources} />}

        {!contentNullOrEmpty && (
          <MessageActions
            className={cn(
              "flex gap-0 opacity-0 transition-opacity group-hover:opacity-100"
            )}
          >
            <MessageAction
              tooltip={copied ? "Copied!" : "Copy text"}
              side="bottom"
              delayDuration={0}
            >
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                aria-label="Copy text"
                onClick={copyToClipboard}
                type="button"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </MessageAction>
            <MessageAction tooltip="Regenerate" side="bottom" delayDuration={0}>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                aria-label="Regenerate"
                onClick={onReload}
                type="button"
              >
                <ArrowClockwise className="size-4" />
              </button>
            </MessageAction>
            <MessageAction
              tooltip={speechStatus === 'started' ? "Stop Reading" : "Read Aloud"}
              side="bottom"
              delayDuration={0}
            >
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                aria-label="Text to Speech"
                onClick={() => (speechStatus === 'started' ? stop() : start())}
                type="button"
              >
                {speechStatus === 'started' ? (
                  <StopCircle className="size-4 text-red-500" />
                ) : (
                  <Volume2 className="size-4 text-green-500" />
                )}
              </button>
            </MessageAction>
          </MessageActions>
        )}
      </div>
    </Message>
  )
}