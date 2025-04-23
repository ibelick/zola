"use client"

import { createContext, useContext, useState } from "react"

type AgentState = {
  status: "idle" | "loading"
}

type AgentContextType = AgentState & {
  //@todo: need better typing
  agentId: string | null
  setAgentId: (id: string | null) => void
  setStatus: (status: AgentState["status"]) => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export const AgentProvider = ({ children }: { children: React.ReactNode }) => {
  const [agentId, setAgentId] = useState<string | null>(null)
  const [status, setStatus] = useState<AgentState["status"]>("idle")

  return (
    <AgentContext.Provider value={{ agentId, setAgentId, status, setStatus }}>
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
