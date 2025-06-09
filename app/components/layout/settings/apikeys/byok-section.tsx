"use client"

import OpenRouterIcon from "@/components/icons/openrouter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { useModel } from "@/lib/model-store/provider"
import { cn } from "@/lib/utils"
import { PlusIcon } from "@phosphor-icons/react"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export function ByokSection() {
  const { userKeyStatus, refreshUserKeyStatus, refreshModels } = useModel()
  const [isLoading, setIsLoading] = useState(false)
  const [openRouterAPIKey, setOpenRouterAPIKey] = useState("")
  const [showOpenRouterInput, setShowOpenRouterInput] = useState(true)

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
      // Refresh both user key status and models after saving
      await Promise.all([refreshUserKeyStatus(), refreshModels()])
    } else {
      toast({
        title: "Failed to save API key",
        description: "Please try again.",
      })
    }

    setOpenRouterAPIKey("sk-or-v1-............")
    setIsLoading(false)
  }

  useEffect(() => {
    if (userKeyStatus.openrouter) {
      setOpenRouterAPIKey("sk-or-v1-............")
    } else {
      setOpenRouterAPIKey("")
    }
  }, [userKeyStatus.openrouter])

  return (
    <div>
      <h3 className="relative mb-2 inline-flex text-lg font-medium">
        Model Providers{" "}
        <span className="text-muted-foreground absolute top-0 -right-7 text-xs">
          new
        </span>
      </h3>
      <p className="text-muted-foreground text-sm">
        Add your own API keys to unlock access to models.
      </p>
      <p className="text-muted-foreground text-sm">
        Your keys are stored securely with end-to-end encryption.
      </p>
      <div className="mt-4 flex flex-row items-start justify-start gap-3">
        <button
          key="openrouter"
          type="button"
          className={cn(
            "flex aspect-square w-28 flex-col items-center justify-center gap-2 rounded-lg border p-4",
            showOpenRouterInput
              ? "border-primary ring-primary/30 ring-2"
              : "border-border"
          )}
        >
          <OpenRouterIcon className="size-4" />
          <span>OpenRouter</span>
        </button>
        <button
          key="soon"
          type="button"
          disabled
          className={cn(
            "flex aspect-square w-28 flex-col items-center justify-center gap-2 rounded-lg border p-4 opacity-20",
            "border-primary border-dashed"
          )}
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      <div className="mt-4">
        {showOpenRouterInput && (
          <div className="flex flex-col">
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
            <div className="mt-0 flex justify-between pl-1">
              <a
                href="https://openrouter.ai/settings/keys"
                target="_blank"
                className="text-muted-foreground mt-1 text-xs hover:underline"
              >
                Get API key
              </a>
              <Button
                onClick={handleSave}
                type="button"
                size="sm"
                className="mt-2"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
