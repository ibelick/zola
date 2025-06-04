"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { useEffect, useState } from "react"

export function ByokSection() {
  const [openRouterAPIKey, setOpenRouterAPIKey] = useState("")
  const [hasUserKey, setHasUserKey] = useState(false)

  const handleSave = async () => {
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
  }

  useEffect(() => {
    const fetchUserKeys = async () => {
      const response = await fetchClient("/api/user-keys")
      const data = await response.json()

      console.log(data)

      setOpenRouterAPIKey(
        data.keys.find(
          (key: { provider: string }) => key.provider === "openrouter"
        )?.maskedKey || ""
      )
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
      <div>
        <Label htmlFor="openrouter-key">API Key</Label>
        <Input
          id="openrouter-key"
          type="password"
          placeholder="sk-open-..."
          value={openRouterAPIKey}
          onChange={(e) => setOpenRouterAPIKey(e.target.value)}
        />
      </div>
      <Button onClick={handleSave}>Save</Button>
    </div>
  )
}
