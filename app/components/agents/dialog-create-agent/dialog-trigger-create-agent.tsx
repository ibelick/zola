"use client"

import { PopoverContentAuth } from "@/app/components/chat-input/popover-content-auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/toast"
import { useAgent } from "@/lib/agent-store/provider"
import { fetchClient } from "@/lib/fetch"
import { API_ROUTE_CREATE_AGENT } from "@/lib/routes"
import { useUser } from "@/lib/user-store/provider"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { useBreakpoint } from "../../../hooks/use-breakpoint"
import { AgentFormData, CreateAgentForm } from "./create-agent-form"

export function DialogCreateAgentTrigger({
  trigger,
}: {
  trigger: React.ReactNode
}) {
  const { user } = useUser()
  const { refetchUserAgents } = useAgent()
  const isAuthenticated = !!user?.id
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    description: "",
    systemPrompt: "",
    mcp: "none",
    tools: [],
  })
  const [repository, setRepository] = useState("")
  const [error, setError] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const isMobile = useBreakpoint(768)

  const generateSystemPrompt = (owner: string, repo: string) => {
    return `You are a helpful GitHub assistant focused on the repository: ${owner}/${repo}.

Use the available tools below to answer any questions. Always prefer using tools over guessing.

Tools available for this repository:
- \`fetch_${repo}_documentation\`: Fetch the entire documentation file.
- \`search_${repo}_documentation\`: Semantically search the documentation.
- \`search_${repo}_code\`: Search code with exact matches using the GitHub API.
- \`fetch_generic_url_content\`: Fetch absolute URLs when referenced in the docs or needed for context.

Never invent answers. Use tools and return what you find.`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}
    if (!formData.name.trim()) newErrors.name = "Agent name is required"
    if (!formData.description.trim())
      newErrors.description = "Description is required"
    if (!formData.systemPrompt.trim())
      newErrors.systemPrompt = "System prompt is required"
    if (
      formData.mcp === "git-mcp" &&
      !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository)
    ) {
      newErrors.repository =
        'Please enter a valid repository in the format "owner/repo"'
    }
    if (Object.keys(newErrors).length) return setError(newErrors)

    setIsLoading(true)
    try {
      if (formData.mcp === "git-mcp") {
        const response = await fetch(
          `https://api.github.com/repos/${repository}`
        )
        if (!response.ok) {
          setError({ repository: "Repository not found." })
          setIsLoading(false)
          return
        }
        formData.repository = repository
      }

      const [owner, repo] = repository.split("/")

      const res = await fetchClient(API_ROUTE_CREATE_AGENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          systemPrompt: formData.systemPrompt,
          avatar_url: repository ? `https://github.com/${owner}.png` : null,
          mcp_config: repository
            ? { server: `https://gitmcp.io/${owner}/${repo}`, variables: [] }
            : null,
          example_inputs: repository
            ? [
                "what does this repository do?",
                "how to install the project?",
                "how can I use this project?",
                "where is the main code located?",
              ]
            : null,
          tools: formData.tools,
          remixable: false,
          is_public: true,
          max_steps: 5,
        }),
      })

      if (!res.ok) throw new Error("Failed to create agent")
      const { agent } = await res.json()
      refetchUserAgents()
      setOpen(false)
      router.push(`/?agent=${agent.slug}`)
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not create agent. Try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const content = (
    <CreateAgentForm
      formData={formData}
      repository={repository}
      setRepository={(e) => setRepository(e.target.value)}
      error={error}
      isLoading={isLoading}
      handleInputChange={(e) => {
        const { name, value } = e.target
        setFormData((f) => ({ ...f, [name]: value }))
        if (error[name]) setError((err) => ({ ...err, [name]: "" }))
      }}
      handleSelectChange={(value) => {
        setFormData((f) => ({ ...f, mcp: value as "none" | "git-mcp" }))
        if (value !== "git-mcp") setError((e) => ({ ...e, repository: "" }))
        if (value === "git-mcp" && /^[^/]+\/[^/]+$/.test(repository)) {
          const [owner, repo] = repository.split("/")
          setFormData((f) => ({
            ...f,
            systemPrompt: generateSystemPrompt(owner, repo),
          }))
        }
      }}
      handleToolsChange={(tools) => setFormData((f) => ({ ...f, tools }))}
      handleSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      isDrawer={isMobile}
    />
  )

  if (!isAuthenticated) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContentAuth />
      </Popover>
    )
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">{content}</DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <div
          className="h-full w-full"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DialogHeader className="border-border border-b px-6 py-4">
            <DialogTitle>Create agent (experimental)</DialogTitle>
          </DialogHeader>
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
