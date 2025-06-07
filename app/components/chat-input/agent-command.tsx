"use client"

import { Agent } from "@/app/types/agent"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { cn } from "@/lib/utils"
import { Cube, Plus } from "@phosphor-icons/react"
import { useEffect, useRef } from "react"
import { DialogCreateAgentTrigger } from "../agents/dialog-create-agent/dialog-trigger-create-agent"

type AgentCommandProps = {
  isOpen: boolean
  searchTerm: string
  onSelect: (agent: Agent) => void
  onClose: () => void
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onCreateNewAgent?: () => void
  curatedAgents: Agent[]
  userAgents: Agent[]
}

export function AgentCommand({
  isOpen,
  searchTerm,
  onSelect,
  onClose,
  activeIndex,
  onActiveIndexChange,
  onCreateNewAgent = () => {},
  curatedAgents,
  userAgents,
}: AgentCommandProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLLIElement>(null)

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Scroll active item into view when activeIndex changes
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" })
    }
  }, [isOpen, activeIndex])

  if (!isSupabaseEnabled) {
    return null
  }

  // Filter agents based on search term
  const filteredAgents = searchTerm
    ? [...curatedAgents, ...userAgents].filter((agent) =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [...curatedAgents, ...userAgents]

  // Helper function to check if an agent is curated
  const isCuratedAgent = (agentId: string) => {
    return curatedAgents.some((curatedAgent) => curatedAgent.id === agentId)
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="bg-popover absolute bottom-full z-50 mb-2 flex w-full max-w-sm flex-col rounded-lg border shadow-md"
    >
      <div className="text-muted-foreground px-3 py-2 text-xs font-medium">
        Agents (experimental)
      </div>
      {filteredAgents.length === 0 ? (
        <div className="py-6 text-center text-sm">No agent found.</div>
      ) : (
        <ul className="max-h-[176px] overflow-auto mask-t-from-96% mask-t-to-100% p-1">
          {filteredAgents.map((agent, index) => {
            return (
              <li
                key={agent.id}
                ref={index === activeIndex ? activeItemRef : null}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-lg px-2 py-1.5",
                  "hover:bg-accent hover:text-accent-foreground",
                  activeIndex === index && "bg-accent text-accent-foreground"
                )}
                onMouseEnter={() => onActiveIndexChange(index)}
                onClick={() => onSelect(agent)}
              >
                <div className="flex items-center gap-2">
                  {agent.avatar_url ? (
                    <Avatar className="size-9">
                      <AvatarImage
                        src={agent.avatar_url}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {agent.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-dashed">
                      <Cube className="text-muted-foreground size-6" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{agent.name}</span>
                    <span className="text-muted-foreground line-clamp-1 text-xs">
                      {agent.description}
                    </span>
                  </div>
                  {isCuratedAgent(agent.id) && (
                    <span className="bg-primary/10 text-primary absolute top-4 right-2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-medium">
                      Zola
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <DialogCreateAgentTrigger
        trigger={
          <div className="border-border mt-auto h-12 border-t p-1">
            <button
              onClick={onCreateNewAgent}
              className="text-primary hover:bg-accent hover:text-accent-foreground flex h-full w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium"
              type="button"
            >
              <Plus size={16} weight="bold" /> Create New Agent
            </button>
          </div>
        }
      />
    </div>
  )
}
