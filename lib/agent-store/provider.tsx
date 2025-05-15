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
import { CURATED_AGENTS_SLUGS } from "../config"
import { createClient } from "../supabase/client"
import { loadGitHubAgent } from "./load-github-agent"

type AgentContextType = {
  currentAgent: Agent | null
  curatedAgents: Agent[] | null
  userAgents: Agent[] | null
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

type AgentProviderProps = {
  children: React.ReactNode
  userId?: string | null
}

export const AgentProvider = ({ children, userId }: AgentProviderProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const agentSlug = searchParams.get("agent")
  const { getChatById } = useChats()
  const { chatId } = useChatSession()
  const currentChat = chatId ? getChatById(chatId) : null
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null)
  const currentChatAgentId = currentChat?.agent_id || null
  const [curatedAgents, setCuratedAgents] = useState<Agent[] | null>(null)
  const [userAgents, setUserAgents] = useState<Agent[] | null>(null)

  const fetchCuratedAgents = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .in("slug", CURATED_AGENTS_SLUGS)

    if (error) {
      console.error("Error fetching curated agents:", error)
    } else {
      setCuratedAgents(data)
    }
  }, [])

  const fetchUserAgents = useCallback(async () => {
    if (!userId) {
      return
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("creator_id", userId)

    if (error) {
      console.error("Error fetching user agents:", error)
    } else {
      setUserAgents(data)
    }
  }, [userId])

  const fetchCurrentAgent = useCallback(async () => {
    if (!agentSlug && !currentChatAgentId) {
      setCurrentAgent(null)
      return
    }

    // IF first time loading agent, check if it's a github agent
    // create one if it doesn't exist
    // @todo:
    // remove it
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

    fetchCurrentAgent()
  }, [pathname, agentSlug, currentChatAgentId, fetchCurrentAgent])

  useEffect(() => {
    fetchCuratedAgents()
  }, [fetchCuratedAgents])

  useEffect(() => {
    if (!userId) {
      return
    }

    fetchUserAgents()
  }, [fetchUserAgents])

  return (
    <AgentContext.Provider value={{ currentAgent, curatedAgents, userAgents }}>
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
