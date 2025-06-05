"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export function ByokSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [openRouterAPIKey, setOpenRouterAPIKey] = useState("")

  const handleSave = async () => {
    setIsLoading(true)
    const response = await fetchClient("/api/user-keys", {
      method: "POST",
      body: JSON.stringify({
        provider: "openrouter",
        apiKey: openRouterAPIKey,
      }),
    })

    if (response.ok) {
      toast({
        title: "API key saved",
        description: "Your API key has been saved.",
      })
    } else {
      toast({
        title: "Failed to save API key",
        description: "Please try again.",
      })
    }

    setOpenRouterAPIKey("")
    setIsLoading(false)
  }

  useEffect(() => {
    const fetchUserKeys = async () => {
      const response = await fetchClient("/api/user-key-status")
      const data = await response.json()

      if (data.openrouter) {
        setOpenRouterAPIKey("sk-or-v1-............")
      } else {
        setOpenRouterAPIKey("")
      }
    }

    fetchUserKeys()
  }, [])

  return (
    <div>
      <h3 className="relative mb-2 inline-flex text-lg font-medium">
        Model Providers{" "}
        <span className="text-muted-foreground absolute top-0 -right-7 text-xs">
          new
        </span>
      </h3>
      <p className="text-muted-foreground text-sm">
        Configure your AI model providers and API keys.
      </p>
      <p className="text-muted-foreground text-sm">
        API keys are stored with end-to-end encryption.
      </p>
      <div className="mt-4 flex flex-col">
        <Label htmlFor="openrouter-key" className="mb-3">
          OpenRouter API Key
        </Label>
        <Input
          id="openrouter-key"
          type="password"
          placeholder={"sk-open-..."}
          value={openRouterAPIKey}
          onChange={(e) => setOpenRouterAPIKey(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="mt-0 flex justify-between pl-1">
        <a
          href="https://openrouter.ai/api-keys"
          target="_blank"
          className="text-muted-foreground mt-1 text-xs hover:underline"
        >
          Get API key
        </a>
        <Button onClick={handleSave} type="button" size="sm" className="mt-2">
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  )
}
