"use client"

import { AgentSummary } from "@/app/types/agent"
import type { Tables } from "@/app/types/database.types"
import { ButtonCopy } from "@/components/common/button-copy"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ChatCircle, Check, CopySimple, User } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function SystemPromptDisplay({ prompt }: { prompt: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = prompt.length > 300

  const displayText =
    isLong && !expanded ? prompt.slice(0, 300) + "..." : prompt

  return (
    <div className="group relative rounded-md border p-2">
      <div className="absolute top-0 right-0 flex h-9 items-center bg-white pr-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <ButtonCopy code={prompt} />
      </div>
      <div className="text-muted-foreground max-h-[expanded ? '400px' : '150px'] overflow-auto text-left font-mono text-sm whitespace-pre-wrap">
        {displayText}
      </div>
      {isLong && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 h-6 text-xs"
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  )
}

type AgentDetailProps = {
  slug: string
  name: string
  description: string
  example_inputs: string[]
  creator_id?: string | null
  avatar_url?: string | null
  onAgentClick?: (agentId: string) => void
  randomAgents: AgentSummary[]
  isFullPage?: boolean
  system_prompt?: string
  tools?: string[]
  mcp_config?: Tables<"agents">["mcp_config"]
}

export function AgentDetail({
  slug,
  name,
  description,
  example_inputs,
  avatar_url,
  onAgentClick,
  randomAgents,
  isFullPage,
  system_prompt,
  tools,
  mcp_config,
}: AgentDetailProps) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${window.location.origin}/agents/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  useEffect(() => {
    if (randomAgents.length > 0 && isFullPage) {
      randomAgents.forEach((agent) => {
        router.prefetch(`/agents/${agent.slug}`)
      })
    }
  }, [randomAgents, router, isFullPage])

  const handleAgentClick = (agent: AgentSummary) => {
    if (onAgentClick) {
      onAgentClick(agent.id)
    } else {
      router.push(`/agents/${agent.slug}`)
    }
  }

  const tryAgentWithPrompt = async (prompt: string) => {
    router.push(`/?agent=${slug}&prompt=${encodeURIComponent(prompt)}`)
  }

  const tryAgent = async () => {
    router.push(`/?agent=${slug}`)
  }

  return (
    <div
      className={cn(
        "bg-background relative flex w-full flex-col",
        "h-full max-h-[80vh]"
      )}
    >
      <div
        className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto",
          isFullPage ? "pb-0" : "pb-20"
        )}
      >
        <div className="mb-6 flex items-center gap-4 pt-8 pl-8">
          <div className="bg-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
            <img
              src={avatar_url || "/placeholder.svg"}
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-medium">{name}</h1>
        </div>

        <div className="px-4 md:px-8">
          <p className="text-muted-foreground mb-6">{description}</p>
        </div>

        {system_prompt && (
          <div className="mt-4 mb-8 px-4 md:px-8">
            <h2 className="mb-4 text-lg font-medium">System Prompt</h2>
            <SystemPromptDisplay prompt={system_prompt} />
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-8">
          <div className="rounded-md border p-2">
            <h3 className="mb-2 text-xs font-medium">Tools</h3>
            <p className="text-muted-foreground text-xs">
              {tools?.length ? tools.join(", ") : "search"}
            </p>
          </div>
          <div className="rounded-md border p-2">
            <h3 className="mb-2 text-xs font-medium">MCP</h3>
            <p className="text-muted-foreground truncate text-xs">
              {mcp_config ? JSON.stringify(mcp_config) : "none"}
            </p>
          </div>
        </div>

        <div className="mb-8 px-4 md:px-8">
          <h2 className="mb-4 text-lg font-medium">What can I ask?</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {example_inputs.map((example_input) => (
              <Button
                key={example_input}
                type="button"
                className="flex h-auto w-full items-center justify-start px-2 py-1 text-left text-xs break-words whitespace-normal"
                variant="outline"
                size="sm"
                onClick={() => tryAgentWithPrompt(example_input)}
              >
                {example_input}
              </Button>
            ))}
          </div>
        </div>

        {randomAgents && randomAgents.length > 0 && (
          <div className="mt-8 pb-8">
            <h2 className="mb-4 pl-4 text-lg font-medium md:pl-8">
              More agents
            </h2>
            <div
              className={cn(
                isFullPage
                  ? "grid grid-cols-1 gap-4 px-4 md:grid-cols-2 md:px-8"
                  : "flex snap-x snap-mandatory scroll-ps-6 flex-nowrap gap-4 overflow-x-auto pl-4 md:pl-8"
              )}
              style={{
                scrollbarWidth: "none",
              }}
            >
              {randomAgents.map((agent, index) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentClick(agent)}
                  className={cn(
                    "bg-secondary hover:bg-accent h-full cursor-pointer rounded-xl p-4 transition-colors",
                    isFullPage ? "w-full" : "min-w-[280px]",
                    index === randomAgents.length - 1 && "mr-6"
                  )}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="bg-muted h-12 w-12 overflow-hidden rounded-full">
                        <Avatar className="h-full w-full object-cover">
                          <AvatarImage
                            src={agent.avatar_url || "/placeholder.svg"}
                            alt={agent.name}
                            className="h-full w-full object-cover"
                          />
                        </Avatar>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-foreground truncate text-base font-medium">
                        {agent.name}
                      </h3>
                      <p className="text-foreground mt-1 line-clamp-2 text-xs">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "bg-background fixed right-0 bottom-0 left-0 z-10 flex flex-row gap-2 border-t px-4 py-4 md:px-8"
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={copyToClipboard}
              className="flex-1 text-center"
              type="button"
              variant="outline"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <CopySimple className="size-4" />
              )}
              Share this agent
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? "Copied to clipboard" : "Copy link to clipboard"}
          </TooltipContent>
        </Tooltip>
        <Button onClick={tryAgent} className="flex-1 text-center" type="button">
          <ChatCircle className="size-4" />
          Chat with {name}
        </Button>
      </div>
    </div>
  )
}
