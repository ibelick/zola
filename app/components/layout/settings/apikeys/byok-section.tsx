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
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export function ByokSection() {
  const { userKeyStatus, refreshUserKeyStatus, refreshModels } = useModel()
  const [openRouterAPIKey, setOpenRouterAPIKey] = useState("")
  const showOpenRouterInput = true

  const defaultKey = "sk-or-v1-............"
  const fallbackValue = userKeyStatus.openrouter ? defaultKey : ""
  const value = openRouterAPIKey || fallbackValue

  const mutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const res = await fetchClient("/api/user-keys", {
        method: "POST",
        body: JSON.stringify({
          provider: "openrouter",
          apiKey,
        }),
      })
      if (!res.ok) throw new Error("Failed to save key")
      return res
    },
    onSuccess: async () => {
      toast({
        title: "API key saved",
        description: "Your API key has been saved.",
      })
      await Promise.all([refreshUserKeyStatus(), refreshModels()])
      setOpenRouterAPIKey(defaultKey)
    },
    onError: () => {
      toast({
        title: "Failed to save API key",
        description: "Please try again.",
      })
    },
  })

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
              value={value}
              onChange={(e) => setOpenRouterAPIKey(e.target.value)}
              disabled={mutation.isPending}
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
                onClick={() => mutation.mutate(value)}
                type="button"
                size="sm"
                className="mt-2"
              >
                {mutation.isPending ? (
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
