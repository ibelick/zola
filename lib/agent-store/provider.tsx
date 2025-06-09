"use client"

import { Agent } from "@/app/types/agent"
import {
  fetchAgentBySlugOrId,
  fetchCuratedAgentsFromDb,
  fetchUserAgentsFromDb,
} from "@/lib/agent-store/api"
import { convertLocalAgentToAgentDb } from "@/lib/agent-store/utils"
import { localAgents } from "@/lib/agents/local-agents"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { useQuery } from "@tanstack/react-query"
import { createContext, ReactNode, useContext, useMemo } from "react"

type AgentContextType = {
  currentAgent: Agent | null
  curatedAgents: Agent[] | null
  userAgents: Agent[] | null
  refetchUserAgents: () => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({
  children,
  userId,
  searchAgentSlug,
}: {
  children: ReactNode
  userId?: string | null
  searchAgentSlug?: string | null
}) {
  const { getChatById } = useChats()
  const { chatId } = useChatSession()
  const currentChat = chatId ? getChatById(chatId) : null
  const currentChatAgentId = currentChat?.agent_id || null
  const agentIdentifier = searchAgentSlug || currentChatAgentId

  const { data: currentAgent } = useQuery({
    queryKey: ["current-agent", agentIdentifier],
    queryFn: async () => {
      if (!agentIdentifier) return null

      if (localAgents[agentIdentifier as keyof typeof localAgents]) {
        return convertLocalAgentToAgentDb(
          localAgents[agentIdentifier as keyof typeof localAgents]
        )
      }

      return await fetchAgentBySlugOrId({
        slug: searchAgentSlug || undefined,
        id: currentChatAgentId || undefined,
      })
    },
    enabled: !!agentIdentifier,
    staleTime: Infinity,
  })

  const { data: curatedAgents } = useQuery({
    queryKey: ["curated-agents"],
    queryFn: fetchCuratedAgentsFromDb,
    staleTime: Infinity,
  })

  const { data: userAgents, refetch: refetchUserAgents } = useQuery({
    queryKey: ["user-agents", userId],
    queryFn: () => (userId ? fetchUserAgentsFromDb(userId) : []),
    enabled: !!userId,
    staleTime: Infinity,
  })

  const contextValue = useMemo(
    () => ({
      currentAgent: currentAgent ?? null,
      curatedAgents: curatedAgents ?? null,
      userAgents: userAgents ?? null,
      refetchUserAgents,
    }),
    [currentAgent, curatedAgents, userAgents, refetchUserAgents]
  )

  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (!context) throw new Error("useAgent must be used within AgentProvider")
  return context
}
