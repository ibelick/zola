"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
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
  //@todo: need better typing
  agentId: string | null
  setAgentId: (id: string | null) => void
  setStatus: (status: AgentState["status"]) => void
  agent: AgentMetadata | null
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export const AgentProvider = ({ children }: { children: React.ReactNode }) => {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [status, setStatus] = useState<AgentState["status"]>("idle")
  const [agent, setAgent] = useState<AgentMetadata | null>(null)

  const fetchAgent = useCallback(async (id: string) => {
    const supabase = createClient()
    setStatus("loading")

    const { data, error } = await supabase
      .from("agents")
      .select("name, description, avatar_url, slug")
      .eq("id", id)
      .single()

    if (error || !data) {
      console.error("Error fetching agent:", error)
      setAgent(null)
    } else {
      setAgent(data)
    }

    setStatus("idle")
  }, [])

  useEffect(() => {
    if (!agentId) {
      setAgent(null)
      return
    }

    fetchAgent(agentId)
  }, [agentId, fetchAgent])

  return (
    <AgentContext.Provider
      value={{ agentId, setAgentId, status, setStatus, agent }}
    >
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
