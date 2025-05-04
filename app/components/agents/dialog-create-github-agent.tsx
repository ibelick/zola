"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { WarningCircle, X } from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"

export function CreateGitHubAgentDialog() {
  const [open, setOpen] = useState(false)
  const [repository, setRepository] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const isMobile = useBreakpoint(768)
  const supabase = createClient()

  const validateRepository = (repo: string) => {
    // Simple validation for owner/repo format
    const regex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/
    return regex.test(repo)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRepository(repository)) {
      setError('Please enter a valid repository in the format "owner/repo"')
      return
    }

    setError("")
    setIsLoading(true)

    try {
      const response = await fetch(`https://api.github.com/repos/${repository}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError(
            "Repository not found. Please check the repository name and try again."
          )
        } else {
          setError(
            `GitHub API error: ${response.status} ${response.statusText}`
          )
        }
        return
      }

      const agentSlug = `github/${repository}`

      const { data: existingAgent, error: dbError } = await supabase
        .from("agents")
        .select("id")
        .eq("slug", agentSlug)
        .maybeSingle()

      if (dbError) {
        setError("Failed to check for existing agent. Please try again.")
        return
      }

      if (existingAgent) {
        setError("An agent for this repository already exists.")
        return
      }

      setOpen(false)
      router.push(`/?agent=${agentSlug}`)
    } catch (error) {
      setError(
        "An unexpected error occurred. Please check your connection and try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const trigger = (
    <button className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-sm">
      Create GitHub Agent
    </button>
  )

  const content = (
    <GitHubAgentContent
      repository={repository}
      setRepository={setRepository}
      error={error}
      isLoading={isLoading}
      handleSubmit={handleSubmit}
      onClose={() => setOpen(false)}
      isDrawer={isMobile}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>{content}</DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-border border-b px-6 py-4">
          <DialogTitle>Create GitHub Agent</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

type GitHubAgentContentProps = {
  repository: string
  setRepository: (value: string) => void
  error: string
  isLoading: boolean
  handleSubmit: (e: React.FormEvent) => Promise<void>
  onClose: () => void
  isDrawer?: boolean
}

function GitHubAgentContent({
  repository,
  setRepository,
  error,
  isLoading,
  handleSubmit,
  onClose,
  isDrawer = false,
}: GitHubAgentContentProps) {
  return (
    <div className={cn("space-y-0", isDrawer ? "p-0 pb-16" : "py-0")}>
      {isDrawer && (
        <div className="border-border mb-2 flex items-center justify-between border-b px-4 pb-2">
          <h2 className="text-lg font-medium">Create GitHub Agent</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="px-6 py-4">
        <p className="text-muted-foreground mb-4 block text-sm">
          Chat with any public repo using{" "}
          <Link href="https://github.com/idosal/git-mcp" className="underline">
            GitMCP
          </Link>
          . We'll generate a dedicated agent.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repository">Repository</Label>
            <Input
              id="repository"
              placeholder="owner/repo"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <div className="mt-1 flex items-center text-sm text-red-500">
                <WarningCircle className="mr-1 size-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Validating..." : "Create Agent"}
          </Button>
        </form>
      </div>
    </div>
  )
}
