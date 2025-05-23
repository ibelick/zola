"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Check, Github, X } from "lucide-react"
import type React from "react"
import { ToolsSection } from "./tools-section"

type AgentFormData = {
  name: string
  description: string
  systemPrompt: string
  mcp: "none" | "git-mcp"
  repository?: string
  tools: string[]
}

type CreateAgentFormProps = {
  formData: AgentFormData
  repository: string
  setRepository: (e: React.ChangeEvent<HTMLInputElement>) => void
  error: { [key: string]: string }
  isLoading: boolean
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  handleSelectChange: (value: string) => void
  handleToolsChange: (selectedTools: string[]) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  onClose: () => void
  isDrawer?: boolean
}

export function CreateAgentForm({
  formData,
  repository,
  setRepository,
  error,
  isLoading,
  handleInputChange,
  handleSelectChange,
  handleToolsChange,
  handleSubmit,
  onClose,
  isDrawer = false,
}: CreateAgentFormProps) {
  return (
    <div
      className={`space-y-0 ${isDrawer ? "p-0 pb-16" : "py-0"} overflow-y-auto`}
    >
      {isDrawer && (
        <div className="border-border mb-2 flex items-center justify-between border-b px-4 pb-2">
          <h2 className="text-lg font-medium">Create agent (experimental)</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="px-6 py-4">
        <div className="bg-muted/50 mb-6 rounded-lg p-3">
          <p className="text-sm">
            Agents can use a system prompt and optionally connect to GitHub
            repos via git-mcp. More tools and MCP integrations are coming soon.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Agent name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Agent"
              value={formData.name}
              onChange={handleInputChange}
              className={error.name ? "border-red-500" : ""}
            />

            {error.name && (
              <div className="mt-1 flex items-center text-sm text-red-500">
                <AlertCircle className="mr-1 h-4 w-4" />
                <span>{error.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="A short description of what this agent does"
              value={formData.description}
              onChange={handleInputChange}
              className={error.description ? "border-red-500" : ""}
            />
            <p className="text-muted-foreground text-xs">
              Short sentence, used in list/search
            </p>
            {error.description && (
              <div className="mt-1 flex items-center text-sm text-red-500">
                <AlertCircle className="mr-1 h-4 w-4" />
                <span>{error.description}</span>
              </div>
            )}
          </div>

          <ToolsSection onSelectTools={handleToolsChange} />

          {/* MCP Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="mcp">MCP</Label>
            <Select value={formData.mcp} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select MCP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="git-mcp">git-mcp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repository (only shown if git-mcp is selected) */}
          {formData.mcp === "git-mcp" && (
            <div className="space-y-2">
              <Label htmlFor="repository">GitHub repository</Label>
              <div className="flex items-center">
                <Github className="text-muted-foreground mr-2 h-4 w-4" />
                <Input
                  id="repository"
                  placeholder="owner/repo"
                  value={repository}
                  onChange={setRepository}
                  className={error.repository ? "border-red-500" : ""}
                />
              </div>

              {error.repository && (
                <div className="mt-1 flex items-center text-sm text-red-500">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  <span>{error.repository}</span>
                </div>
              )}
            </div>
          )}

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System prompt</Label>
            <Textarea
              id="systemPrompt"
              name="systemPrompt"
              placeholder="You are a helpful assistant..."
              value={formData.systemPrompt}
              onChange={handleInputChange}
              className={`h-32 font-mono ${error.systemPrompt ? "border-red-500" : ""}`}
            />
            {error.systemPrompt && (
              <div className="mt-1 flex items-center text-sm text-red-500">
                <AlertCircle className="mr-1 h-4 w-4" />
                <span>{error.systemPrompt}</span>
              </div>
            )}
          </div>

          {/* Tools (only shown if git-mcp is selected) */}
          {formData.mcp === "git-mcp" && (
            <div className="overflow-hidden rounded-lg border p-2">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Enabled tools via git-mcp:
                </h3>
                <Badge
                  variant="outline"
                  className="border-green-200 bg-green-50 text-green-700"
                >
                  <Check className="mr-1 h-3 w-3" /> Enabled
                </Badge>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>get_repo_info</li>
                <li>list_issues</li>
                <li>create_issue</li>
                <li>get_file_contents</li>
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Agent..." : "Create Agent"}
          </Button>
        </form>
      </div>
    </div>
  )
}
