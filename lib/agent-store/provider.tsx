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
}

type AgentState = {
  status: "idle" | "loading"
}

type AgentContextType = AgentState & {
  agentId: string | null
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
  const agentId = currentChat?.agent_id || null

  const fetchAgent = useCallback(async () => {
    if (!agentSlug) {
      setAgent(null)
      return
    }

    const supabase = createClient()
    setStatus("loading")

    const { data, error } = await supabase
      .from("agents")
      .select("name, description, avatar_url, slug")
      .eq("slug", agentSlug)
      .single()

    if (error || !data) {
      console.error("Error fetching agent:", error)
      setAgent(null)
    } else {
      setAgent(data)
    }

    setStatus("idle")
  }, [agentSlug])

  useEffect(() => {
    if (!agentSlug) {
      setAgent(null)
      return
    }

    fetchAgent()
  }, [pathname, agentSlug])

  return (
    <AgentContext.Provider value={{ agentId, status, setStatus, agent }}>
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
