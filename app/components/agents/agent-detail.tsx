"use client"

import { useUser } from "@/app/providers/user-provider"
import { AgentSummary } from "@/app/types/agent"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getOrCreateGuestUserId } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ChatCircle, User } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"

type AgentDetailProps = {
  id: string
  name: string
  description: string
  example_inputs: string[]
  creator_id: string
  avatar_url: string
  agents: AgentSummary[]
  onAgentClick?: (agentId: string) => void
  randomAgents: AgentSummary[]
}

export function AgentDetail({
  id,
  name,
  description,
  example_inputs,
  creator_id,
  avatar_url,
  onAgentClick,
  randomAgents,
}: AgentDetailProps) {
  const router = useRouter()
  const { user } = useUser()

  const createNewChatWithAgent = async () => {
    const uid = await getOrCreateGuestUserId(user)
    if (!uid) return

    const data = {
      agentId: id,
      userId: uid,
      title: `Conversation with ${name}`,
      model: "pixtral-large-latest",
      isAuthenticated: true,
    }

    const response = await fetch("/chat/api/create-chat-agent", {
      method: "POST",
      body: JSON.stringify(data),
    })

    if (response.ok) {
      const data = await response.json()
      router.push(`/chat/c/${data.chatId}`)
    } else {
      console.error("Failed to create chat")
    }
  }

  return (
    <div className="bg-background overflow-x-hidden overflow-y-auto pb-16">
      <div className="mb-6 flex items-center gap-4 pt-12 pl-8">
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

      <div className="px-8">
        <p className="text-muted-foreground mb-6">{description}</p>
      </div>

      <div className="mb-8 px-8">
        <h2 className="mb-4 text-lg font-medium">What can I ask?</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {example_inputs.map((example_input) => (
            <button
              key={example_input}
              type="button"
              className="text-foreground prose bg-accent hover:bg-muted relative rounded-3xl p-2 px-5 py-2.5 text-xs break-words whitespace-normal transition-colors"
            >
              {example_input}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 pb-8">
        <h2 className="mb-4 pl-8 text-lg font-medium">More agents</h2>
        <div className="flex snap-x snap-mandatory scroll-ps-6 flex-nowrap gap-4 overflow-x-auto pl-8">
          {randomAgents.map((agent, index) => (
            <div
              key={agent.id}
              onClick={() => onAgentClick?.(agent.id)}
              className={cn(
                "bg-secondary hover:bg-accent h-full w-full max-w-[250px] min-w-[250px] cursor-pointer rounded-xl p-4 transition-colors",
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
      <div className="absolute right-0 bottom-0 left-0 mb-8 px-8">
        <Button
          onClick={createNewChatWithAgent}
          className="w-full text-center"
          type="button"
        >
          <ChatCircle className="size-4" />
          Try this agent
        </Button>
      </div>
    </div>
  )
}
