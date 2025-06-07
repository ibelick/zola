"use client"

import { Label } from "@/components/ui/label"
import { getAllTools } from "@/lib/tools"
import { cn } from "@/lib/utils"
import React, { useEffect, useState } from "react"

const isDev = process.env.NODE_ENV === "development"

type ToolsSectionProps = {
  onSelectTools: (selectedTools: string[]) => void
}

export function ToolsSection({ onSelectTools }: ToolsSectionProps) {
  const [availableTools, setAvailableTools] = useState<string[] | null>(null)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const tools = getAllTools()

  useEffect(() => {
    if (!isDev) return

    const fetchTools = async () => {
      try {
        const response = await fetch("/api/tools-available")
        const data = await response.json()
        setAvailableTools(data.available || [])
      } catch (error) {
        console.error("Failed to fetch available tools:", error)
      }
    }
    fetchTools()
  }, [])

  const handleToolToggle = (toolId: string) => {
    const newSelection = selectedTools.includes(toolId)
      ? selectedTools.filter((id) => id !== toolId)
      : [...selectedTools, toolId]

    setSelectedTools(newSelection)
    onSelectTools(newSelection)
  }

  // Development mode required
  if (!isDev) {
    return (
      <div className="space-y-2">
        <div className="space-y-2">
          <Label>Tools</Label>
          <p className="text-muted-foreground text-sm">
            Tools are only available in development mode.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tools">Tools</Label>
        <p className="text-muted-foreground text-sm">
          Select tools to enable for this agent. Tools are used to interact with
          the world.
        </p>
      </div>

      <div className="grid gap-3">
        {tools.map((tool) => {
          const isSelected = selectedTools.includes(tool.id)
          const isAvailable = availableTools?.includes(tool.id)

          return (
            <div
              key={tool.id}
              className={cn(
                "cursor-pointer rounded-lg border p-4 transition-all hover:shadow-sm",
                isSelected
                  ? "border-primary bg-primary/5 ring-primary/20 ring-1"
                  : "border-border hover:border-primary/50",
                !isAvailable && "cursor-not-allowed opacity-60"
              )}
              onClick={() => isAvailable && handleToolToggle(tool.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center pt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!isAvailable}
                    className="size-4"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-medium">{tool.id}</h3>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedTools.length > 0 && (
        <div className="bg-muted/50 rounded-lg border p-3">
          <div className="mb-1 text-sm font-medium">Selected tools:</div>
          <div className="text-muted-foreground text-xs">
            {selectedTools
              .map((toolId) => {
                const tool = tools.find((t) => t.id === toolId)
                return tool?.description || toolId
              })
              .join(", ")}
          </div>
        </div>
      )}

      {tools.length === 0 && (
        <div className="text-muted-foreground py-6 text-center">
          <p className="text-sm">No tools available</p>
        </div>
      )}
    </div>
  )
}
