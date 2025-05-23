import { Label } from "@/components/ui/label"
import { getAllTools } from "@/lib/tools"
import { Tool } from "ai"
import React, { useEffect, useState } from "react"

export function ToolsSection() {
  const [availableTools, setAvailableTools] = useState<Tool[]>([])
  const tools = getAllTools()

  useEffect(() => {
    const fetchTools = async () => {
      const response = await fetch("/api/tools-available")
      const data = await response.json()
      setAvailableTools(data.available)
    }
    fetchTools()
  }, [])

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label htmlFor="tools">Tools</Label>
        <p className="text-muted-foreground text-sm">
          Tools are used to interact with the world.
        </p>
      </div>
      {tools.map((tool) => (
        <div key={tool.id}>
          <h3>{tool.label}</h3>
          <p>{tool.description}</p>
        </div>
      ))}
    </div>
  )
}
