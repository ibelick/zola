"use client"

import ClaudeIcon from "@/components/icons/claude"
import GoogleIcon from "@/components/icons/google"
import MistralIcon from "@/components/icons/mistral"
import OpenAIIcon from "@/components/icons/openai"
import OpenRouterIcon from "@/components/icons/openrouter"
import PerplexityIcon from "@/components/icons/perplexity"
import XaiIcon from "@/components/icons/xai"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { useModel } from "@/lib/model-store/provider"
import { cn } from "@/lib/utils"
import { PlusIcon } from "@phosphor-icons/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

type Provider = {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
  getKeyUrl: string
  defaultKey: string
}

const PROVIDERS: Provider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: OpenRouterIcon,
    placeholder: "sk-or-v1-...",
    getKeyUrl: "https://openrouter.ai/settings/keys",
    defaultKey: "sk-or-v1-............",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: OpenAIIcon,
    placeholder: "sk-...",
    getKeyUrl: "https://platform.openai.com/api-keys",
    defaultKey: "sk-............",
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: MistralIcon,
    placeholder: "...",
    getKeyUrl: "https://console.mistral.ai/api-keys/",
    defaultKey: "............",
  },
  {
    id: "google",
    name: "Google",
    icon: GoogleIcon,
    placeholder: "AIza...",
    getKeyUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    defaultKey: "AIza............",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: PerplexityIcon,
    placeholder: "pplx-...",
    getKeyUrl: "https://docs.perplexity.ai/guides/getting-started",
    defaultKey: "pplx-............",
  },
  {
    id: "xai",
    name: "XAI",
    icon: XaiIcon,
    placeholder: "xai-...",
    getKeyUrl: "https://console.x.ai/",
    defaultKey: "xai-............",
  },
  {
    id: "anthropic",
    name: "Claude",
    icon: ClaudeIcon,
    placeholder: "sk-ant-...",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    defaultKey: "sk-ant-............",
  },
]

export function ByokSection() {
  const queryClient = useQueryClient()
  const { userKeyStatus, refreshUserKeyStatus, refreshModels } = useModel()
  const [selectedProvider, setSelectedProvider] = useState<string>("openrouter")
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState<string>("")

  const selectedProviderConfig = PROVIDERS.find(
    (p) => p.id === selectedProvider
  )

  const getProviderValue = (providerId: string) => {
    const provider = PROVIDERS.find((p) => p.id === providerId)
    if (!provider) return ""

    const hasKey = userKeyStatus[providerId as keyof typeof userKeyStatus]
    const fallbackValue = hasKey ? provider.defaultKey : ""
    return apiKeys[providerId] || fallbackValue
  }

  const saveMutation = useMutation({
    mutationFn: async ({
      provider,
      apiKey,
    }: {
      provider: string
      apiKey: string
    }) => {
      const res = await fetchClient("/api/user-keys", {
        method: "POST",
        body: JSON.stringify({
          provider,
          apiKey,
        }),
      })
      if (!res.ok) throw new Error("Failed to save key")
      return res.json()
    },
    onSuccess: async (response, { provider }) => {
      const providerConfig = PROVIDERS.find((p) => p.id === provider)

      toast({
        title: "API key saved",
        description: response.isNewKey
          ? `Your ${providerConfig?.name} API key has been saved and models have been added to your favorites.`
          : `Your ${providerConfig?.name} API key has been updated.`,
      })

      // Refresh models and user key status
      await Promise.all([refreshUserKeyStatus(), refreshModels()])

      // If new models were added to favorites, refresh the favorite models cache
      if (response.isNewKey) {
        queryClient.invalidateQueries({ queryKey: ["favorite-models"] })
      }

      setApiKeys((prev) => ({
        ...prev,
        [provider]: providerConfig?.defaultKey || "",
      }))
    },
    onError: (_, { provider }) => {
      const providerConfig = PROVIDERS.find((p) => p.id === provider)
      toast({
        title: "Failed to save API key",
        description: `Failed to save ${providerConfig?.name} API key. Please try again.`,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetchClient("/api/user-keys", {
        method: "DELETE",
        body: JSON.stringify({
          provider,
        }),
      })
      if (!res.ok) throw new Error("Failed to delete key")
      return res
    },
    onSuccess: async (_, provider) => {
      const providerConfig = PROVIDERS.find((p) => p.id === provider)
      toast({
        title: "API key deleted",
        description: `Your ${providerConfig?.name} API key has been deleted.`,
      })
      await Promise.all([refreshUserKeyStatus(), refreshModels()])
      setApiKeys((prev) => ({ ...prev, [provider]: "" }))
      setDeleteDialogOpen(false)
      setProviderToDelete("")
    },
    onError: (_, provider) => {
      const providerConfig = PROVIDERS.find((p) => p.id === provider)
      toast({
        title: "Failed to delete API key",
        description: `Failed to delete ${providerConfig?.name} API key. Please try again.`,
      })
      setDeleteDialogOpen(false)
      setProviderToDelete("")
    },
  })

  const handleConfirmDelete = () => {
    if (providerToDelete) {
      deleteMutation.mutate(providerToDelete)
    }
  }

  const handleDeleteClick = (providerId: string) => {
    setProviderToDelete(providerId)
    setDeleteDialogOpen(true)
  }

  const handleSave = (providerId: string) => {
    const value = getProviderValue(providerId)
    saveMutation.mutate({ provider: providerId, apiKey: value })
  }

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

      <div className="mt-4 grid grid-cols-4 gap-3">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => setSelectedProvider(provider.id)}
            className={cn(
              "flex aspect-square min-w-28 flex-col items-center justify-center gap-2 rounded-lg border p-4",
              selectedProvider === provider.id
                ? "border-primary ring-primary/30 ring-2"
                : "border-border"
            )}
          >
            <provider.icon className="size-4" />
            <span>{provider.name}</span>
          </button>
        ))}
        <button
          key="soon"
          type="button"
          disabled
          className={cn(
            "flex aspect-square min-w-28 flex-col items-center justify-center gap-2 rounded-lg border p-4 opacity-20",
            "border-primary border-dashed"
          )}
        >
          <PlusIcon className="size-4" />
        </button>
      </div>

      <div className="mt-4">
        {selectedProviderConfig && (
          <div className="flex flex-col">
            <Label htmlFor={`${selectedProvider}-key`} className="mb-3">
              {selectedProviderConfig.name} API Key
            </Label>
            <Input
              id={`${selectedProvider}-key`}
              type="password"
              placeholder={selectedProviderConfig.placeholder}
              value={getProviderValue(selectedProvider)}
              onChange={(e) =>
                setApiKeys((prev) => ({
                  ...prev,
                  [selectedProvider]: e.target.value,
                }))
              }
              disabled={saveMutation.isPending}
            />
            <div className="mt-0 flex justify-between pl-1">
              <a
                href={selectedProviderConfig.getKeyUrl}
                target="_blank"
                className="text-muted-foreground mt-1 text-xs hover:underline"
              >
                Get API key
              </a>
              <div className="flex gap-2">
                {userKeyStatus[
                  selectedProvider as keyof typeof userKeyStatus
                ] && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleDeleteClick(selectedProvider)}
                    disabled={
                      deleteMutation.isPending || saveMutation.isPending
                    }
                  >
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                )}
                <Button
                  onClick={() => handleSave(selectedProvider)}
                  type="button"
                  size="sm"
                  className="mt-2"
                  disabled={saveMutation.isPending || deleteMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your{" "}
              {PROVIDERS.find((p) => p.id === providerToDelete)?.name} API key?
              This action cannot be undone and you will lose access to{" "}
              {PROVIDERS.find((p) => p.id === providerToDelete)?.name} models.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
