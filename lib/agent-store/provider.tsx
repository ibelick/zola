"use client"

import { useChatSession } from "@/app/providers/chat-session-provider"
import { Agent } from "@/app/types/agent"
import { usePathname, useSearchParams } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useChats } from "../chat-store/chats/provider"
import { createClient } from "../supabase/client"
import { loadGitHubAgent } from "./load-github-agent"

type AgentContextType = {
  currentAgent: Agent | null
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export const AgentProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const agentSlug = searchParams.get("agent")
  const { getChatById } = useChats()
  const { chatId } = useChatSession()
  const currentChat = chatId ? getChatById(chatId) : null
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const currentChatAgentId = currentChat?.agent_id || null

  const fetchAgent = useCallback(async () => {
    if (!agentSlug && !currentChatAgentId) {
      setCurrentAgent(null)
      return
    }

    // IF first time loading agent, check if it's a github agent
    // create one if it doesn't exist
    // @todo: first platform agent, more scalable way coming
    if (agentSlug?.startsWith("github/")) {
      const specialAgent = await loadGitHubAgent(agentSlug)

      if (specialAgent) {
        setCurrentAgent(specialAgent)
        return
      }
    }

    const supabase = createClient()
    let query = supabase.from("agents").select("*")

    if (agentSlug) {
      query = query.eq("slug", agentSlug)
    } else if (currentChatAgentId) {
      query = query.eq("id", currentChatAgentId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      console.error("Error fetching agent:", error)
      setCurrentAgent(null)
    } else {
      setCurrentAgent(data)
    }
  }, [agentSlug, currentChatAgentId])

  useEffect(() => {
    if (!agentSlug && !currentChatAgentId) {
      setCurrentAgent(null)
      return
    }

    fetchAgent()
  }, [pathname, agentSlug, currentChatAgentId, fetchAgent])

  return (
    <AgentContext.Provider value={{ currentAgent }}>
      {children}
    </AgentContext.Provider>
  )
}

export const useAgent = () => {
  const context = useContext(AgentContext)
  if (!context)
    throw new Error("useAgentContext must be used within AgentProvider")
  return context
}
