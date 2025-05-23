"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { PlugsConnected } from "@phosphor-icons/react"
import { useEffect, useState } from "react"

interface DeveloperTool {
  id: string
  name: string
  icon: string
  description: string
  envKeys: string[]
  connected: boolean
  maskedKey: string | null
  sampleEnv: string
}

interface DeveloperToolsResponse {
  tools: DeveloperTool[]
}

export function ConnectionsSection() {
  const [tools, setTools] = useState<DeveloperTool[]>([])
  const [loading, setLoading] = useState(true)
  const isDev = process.env.NODE_ENV === "development"

  useEffect(() => {
    // Check if we're in development

    const fetchTools = async () => {
      try {
        const response = await fetch("/api/developer-tools")
        if (response.ok) {
          const data: DeveloperToolsResponse = await response.json()
          setTools(data.tools)
        }
      } catch (error) {
        console.error("Failed to fetch developer tools:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isDev) {
      fetchTools()
    } else {
      setLoading(false)
    }
  }, [isDev])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        status: "success",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Failed to copy to clipboard",
        status: "error",
      })
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="text-muted-foreground">Loading connections...</div>
      </div>
    )
  }

  // Production or no development mode
  if (!isDev) {
    return (
      <div className="py-8 text-center">
        <PlugsConnected className="text-muted-foreground mx-auto mb-2 size-12" />
        <h3 className="mb-1 text-sm font-medium">No connections available</h3>
        <p className="text-muted-foreground text-sm">
          Third-party service connections will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="mb-2 text-lg font-medium">Tool connections</h3>
        <p className="text-muted-foreground text-sm">
          Add API keys in .env.local to enable tools like Exa and GitHub. These
          keys follow specific formats and are only used in development mode.
        </p>
      </div>

      {/* Tools List */}
      <div className="space-y-6">
        {tools.map((tool, index) => (
          <div key={tool.id} className="border-border rounded-lg border p-3">
            <div className="space-y-4">
              {/* Tool Header */}
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="font-medium">{tool.name}</h4>
                    {tool.connected ? (
                      <span className="bg-secondary text-secondary-foreground flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                        Connected
                      </span>
                    ) : (
                      <span className="bg-destructive/10 text-destructive flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                        Not connected
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-3 text-sm">
                    {tool.description}
                  </p>

                  {/* Connected State - Show Masked Key */}
                  {tool.connected && tool.maskedKey && (
                    <div className="flex flex-col gap-2">
                      <div className="text-muted-foreground text-sm">
                        Key detected:
                      </div>
                      <div className="text-muted-foreground bg-secondary mb-3 rounded px-3 py-2 font-mono text-xs">
                        {tool.maskedKey}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Required Keys Section - Always Show */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Required keys:</p>
                <div className="relative">
                  <pre className="bg-muted text-foreground overflow-x-auto rounded-md border p-3 font-mono text-xs">
                    {tool.sampleEnv}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 h-6 px-2 text-xs"
                    onClick={() => copyToClipboard(tool.sampleEnv)}
                  >
                    Copy to clipboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
