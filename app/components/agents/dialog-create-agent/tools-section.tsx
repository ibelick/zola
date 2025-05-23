import { Label } from "@/components/ui/label"
import { getAvailableTools, TOOL_REGISTRY } from "@/lib/tools"
import React from "react"

const tools = getAvailableTools()

console.log(TOOL_REGISTRY)

export function ToolsSection() {
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
