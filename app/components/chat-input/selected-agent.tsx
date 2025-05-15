"use client"

import { Agent } from "@/app/types/agent"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  HoverCard as HoverCardComponent,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Cube, Eye } from "@phosphor-icons/react"
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import React, { useState } from "react"

const TRANSITION = {
  type: "spring",
  duration: 0.2,
  bounce: 0,
}

function HoverCard({
  selectedAgent,
  isOpen,
  setIsOpen,
}: {
  selectedAgent: Agent
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) {
  return (
    <HoverCardComponent open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger className="w-full">
        <div className="bg-background hover:bg-accent border-input mr-2 mb-0 flex max-w-56 cursor-default items-center gap-2 rounded-2xl border p-2 pr-3 transition-colors">
          <div className="flex items-center gap-1.5">
            {selectedAgent.avatar_url ? (
              <Avatar className="size-5">
                <AvatarImage src={selectedAgent.avatar_url ?? undefined} />
                <AvatarFallback>
                  {selectedAgent.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-5 items-center justify-center overflow-hidden rounded-full border border-dashed">
                <Cube className="text-muted-foreground size-3" />
              </div>
            )}
            <span className="text-sm font-medium">{selectedAgent.name}</span>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 px-3 py-2.5" side="top" align="start">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {selectedAgent.avatar_url ? (
              <Avatar className="size-5">
                <AvatarImage src={selectedAgent.avatar_url ?? undefined} />
                <AvatarFallback>
                  {selectedAgent.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-5 items-center justify-center overflow-hidden rounded-full border border-dashed">
                <Cube className="text-muted-foreground size-3" />
              </div>
            )}
            <h3 className="text-base font-medium">{selectedAgent.name}</h3>
          </div>

          <p className="text-muted-foreground mt-1 line-clamp-2 font-mono text-xs">
            {selectedAgent.system_prompt}
          </p>

          <hr className="border-border my-2 border-dashed" />

          <Link href={`/agents/${selectedAgent.slug}`}>
            <Button variant="outline" className="h-7 w-full text-xs" size="sm">
              See agent page <Eye className="size-3" />
            </Button>
          </Link>

          {/* <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1">
              <Wrench className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-sm leading-1">
                Tools
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Toolbox className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-sm leading-1">
                MCP
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FireSimple className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-sm leading-1">
                1.3k used
              </span>
            </div>
          </div> */}

          {/* {selectedAgent.tags && selectedAgent.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedAgent.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )} */}
        </div>
      </HoverCardContent>
    </HoverCardComponent>
  )
}

type SelectedAgentProps = {
  selectedAgent: Agent | null
  removeSelectedAgent: () => void
}

export function SelectedAgent({
  selectedAgent,
  removeSelectedAgent,
}: SelectedAgentProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AnimatePresence initial={false}>
      {selectedAgent && (
        <motion.div
          key={selectedAgent.id}
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={TRANSITION}
          className="overflow-hidden"
        >
          <div className="flex flex-row px-3 pt-0">
            <motion.div key="selected-agent-item" className="relative pt-2">
              <HoverCard
                selectedAgent={selectedAgent}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={removeSelectedAgent}
                    className="border-background absolute top-3 right-3 z-10 inline-flex size-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] bg-black text-white shadow-none transition-colors"
                    aria-label="Remove selected agent"
                  >
                    <X className="size-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Remove {selectedAgent.name}</TooltipContent>
              </Tooltip>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
