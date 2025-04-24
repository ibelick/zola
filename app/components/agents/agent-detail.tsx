"use client"

import { useUser } from "@/app/providers/user-provider"
import { AgentSummary } from "@/app/types/agent"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useChats } from "@/lib/chat-store/chats/provider"
import { MODEL_DEFAULT } from "@/lib/config"
import { cn } from "@/lib/utils"
import { ChatCircle, Check, CopySimple, User } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type AgentDetailProps = {
  id: string
  slug: string
  name: string
  description: string
  example_inputs: string[]
  creator_id: string
  avatar_url?: string | null
  onAgentClick?: (agentId: string) => void
  randomAgents: AgentSummary[]
  isFullPage?: boolean
  isMobile?: boolean
}

export function AgentDetail({
  id,
  slug,
  name,
  description,
  example_inputs,
  creator_id,
  avatar_url,
  onAgentClick,
  randomAgents,
  isFullPage,
  isMobile,
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
    <div className="bg-background relative overflow-x-hidden overflow-y-auto pb-16">
      <div className="mb-6 flex items-center gap-4 pt-8 pl-8">
        <div className="bg-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
          <img
            src={avatar_url || "/placeholder.svg"}
            alt={name}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-medium">{name}</h1>
          <div className="text-muted-foreground mt-1 flex items-center text-sm">
            <User className="mr-1 size-3" />
            <span>Created by {creator_id}</span>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8">
        <p className="text-muted-foreground mb-6">{description}</p>
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
          <h2 className="mb-4 pl-4 text-lg font-medium md:pl-8">More agents</h2>
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

      <div
        className={cn(
          "right-0 bottom-0 left-0 mb-8 flex flex-row gap-2 px-4 md:px-8",
          isMobile ? "relative" : "absolute"
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
          Try this agent
        </Button>
      </div>
    </div>
  )
}
