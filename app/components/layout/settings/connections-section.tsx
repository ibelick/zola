"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    // Check if we're in development
    setIsDev(process.env.NODE_ENV === "development")

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

  const copyAllEnvBlock = () => {
    const envBlock = tools
      .filter((tool) => !tool.connected)
      .map((tool) => tool.sampleEnv)
      .join("\n\n")
    copyToClipboard(envBlock)
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

  const hasDisconnectedTools = tools.some((tool) => !tool.connected)
  const connectedCount = tools.filter((tool) => tool.connected).length
  const totalCount = tools.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🧪</span>
            <h3 className="text-lg font-medium">Developer Tool Connections</h3>
            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
              DEV MODE
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {connectedCount}/{totalCount} tools connected • Only visible in
            development
          </p>
        </div>

        {hasDisconnectedTools && (
          <Button
            onClick={copyAllEnvBlock}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            📋 Copy all env vars
          </Button>
        )}
      </div>

      {/* Tools List */}
      <div className="space-y-4">
        {tools.map((tool, index) => (
          <div key={tool.id}>
            <div className="bg-card flex items-start gap-4 rounded-lg border p-4">
              <span className="mt-1 text-2xl">{tool.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="font-medium">{tool.name}</h4>
                  {tool.connected ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-sm text-green-600">
                      ✅ Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-sm text-red-500">
                      ❌ Not connected
                    </span>
                  )}
                </div>

                <p className="text-muted-foreground mb-3 text-sm">
                  {tool.description}
                </p>

                {tool.connected && tool.maskedKey ? (
                  <div className="text-muted-foreground bg-muted/50 rounded px-3 py-2 font-mono text-xs">
                    <span className="font-medium">API Key:</span>{" "}
                    {tool.maskedKey}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Add to your .env.local:
                    </p>
                    <div className="relative">
                      <pre className="bg-muted text-foreground overflow-x-auto rounded-md border p-3 font-mono text-xs">
                        {tool.sampleEnv}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 h-6 px-2 text-xs"
                        onClick={() => copyToClipboard(tool.sampleEnv)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {index < tools.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center">
        <p className="text-muted-foreground mb-2 text-xs">
          Tool connections are only available in development.
        </p>
        <a
          href="https://github.com/ibelick/zola"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 underline hover:text-blue-600"
        >
          View setup guide on GitHub →
        </a>
      </div>
    </div>
  )
}
