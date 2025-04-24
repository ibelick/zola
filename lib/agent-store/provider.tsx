"use client"

import { useChatSession } from "@/app/providers/chat-session-provider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useChats } from "../chat-store/chats/provider"
import { createClient } from "../supabase/client"

type AgentMetadata = {
  name: string
  description: string
  avatar_url: string | null
  slug: string
  tools_enabled: boolean
  id: string
}

type AgentState = {
  status: "idle" | "loading"
}

type AgentContextType = AgentState & {
  setStatus: (status: AgentState["status"]) => void
  agent: AgentMetadata | null
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export const AgentProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const agentSlug = searchParams.get("agent")
  const { getChatById } = useChats()
  const { chatId } = useChatSession()
  const currentChat = chatId ? getChatById(chatId) : null
  const [status, setStatus] = useState<AgentState["status"]>("idle")
  const [agent, setAgent] = useState<AgentMetadata | null>(null)
  const currentChatAgentId = currentChat?.agent_id || null

  const fetchAgent = useCallback(async () => {
    if (!agentSlug && !currentChatAgentId) {
      setAgent(null)
      return
    }

    const supabase = createClient()
    setStatus("loading")

    let query = supabase
      .from("agents")
      .select("name, description, avatar_url, slug, tools_enabled, id")

    if (agentSlug) {
      query = query.eq("slug", agentSlug)
    } else if (currentChatAgentId) {
      query = query.eq("id", currentChatAgentId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      console.error("Error fetching agent:", error)
      setAgent(null)
    } else {
      setAgent(data)
    }

    setStatus("idle")
  }, [agentSlug, currentChatAgentId])

  useEffect(() => {
    if (!agentSlug && !currentChatAgentId) {
      setAgent(null)
      return
    }

    fetchAgent()
  }, [pathname, agentSlug, currentChatAgentId, fetchAgent])

  return (
    <AgentContext.Provider value={{ status, setStatus, agent }}>
      {children}
    </AgentContext.Provider>
  )
}

export const useAgentContext = () => {
  const context = useContext(AgentContext)
  if (!context)
    throw new Error("useAgentContext must be used within AgentProvider")
  return context
}
