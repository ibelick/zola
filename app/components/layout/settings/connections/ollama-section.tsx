"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { useEffect, useState } from "react"

export function OllamaSection() {
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434")
  const [enableOllama, setEnableOllama] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState("")

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf")
        if (response.ok) {
          const cookies = document.cookie.split(";")
          const csrfCookie = cookies.find((c) =>
            c.trim().startsWith("csrf_token=")
          )
          if (csrfCookie) {
            setCsrfToken(csrfCookie.split("=")[1])
          }
        }
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error)
      }
    }

    const fetchOllamaSettings = async () => {
      try {
        const response = await fetch("/api/ollama-settings")
        if (response.ok) {
          const data = await response.json()
          if (data.endpoint) {
            setOllamaEndpoint(data.endpoint)
          }
          if (data.enabled !== undefined) {
            setEnableOllama(data.enabled)
          }
        }
      } catch (error) {
        console.error("Failed to fetch Ollama settings:", error)
      }
    }

    fetchCsrfToken()
    fetchOllamaSettings()
  }, [])

  const handleSave = async () => {
    if (!csrfToken) {
      console.error("CSRF token not available")
      return
    }

    setIsLoading(true)
    try {
      await fetch("/api/ollama-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: ollamaEndpoint,
          enabled: enableOllama,
          csrfToken,
        }),
      })

      toast({
        title: "Ollama settings saved successfully",
        description: "You can now use Ollama to run models locally.",
      })
    } catch (error) {
      toast({
        title: "Failed to save Ollama settings",
        description: "Please check your Ollama endpoint and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    if (!ollamaEndpoint) return

    setIsLoading(true)
    try {
      const response = await fetch(`${ollamaEndpoint}/api/tags`)
      if (response.ok) {
        toast({
          title: "Ollama connection successful",
          description: "You can now use Ollama to run models locally.",
        })
      } else {
        toast({
          title: "Ollama connection failed",
          description: "Please check your Ollama endpoint and try again.",
        })
      }
    } catch (error) {
      toast({
        title: "Ollama connection failed",
        description: "Please check your Ollama endpoint and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">Local Model Settings</h3>
        <p className="text-muted-foreground text-sm">
          Configure your local Ollama instance for running models locally.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ollama</span>
            <Switch checked={enableOllama} onCheckedChange={setEnableOllama} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ollama-endpoint">Endpoint</Label>
            <Input
              id="ollama-endpoint"
              type="url"
              placeholder="http://localhost:11434"
              value={ollamaEndpoint}
              onChange={(e) => setOllamaEndpoint(e.target.value)}
              disabled={!enableOllama}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Default Ollama endpoint. Make sure Ollama is running locally.
            </p>
          </div>

          {enableOllama && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={isLoading || !ollamaEndpoint}
              >
                {isLoading ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
