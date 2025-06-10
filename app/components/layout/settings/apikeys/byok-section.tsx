"use client"

import OpenRouterIcon from "@/components/icons/openrouter"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { fetchClient } from "@/lib/fetch"
import { useModel } from "@/lib/model-store/provider"
import { cn } from "@/lib/utils"
import { PlusIcon } from "@phosphor-icons/react"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"

export function ByokSection() {
  const { userKeyStatus, refreshUserKeyStatus, refreshModels } = useModel()
  const [openRouterAPIKey, setOpenRouterAPIKey] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const showOpenRouterInput = true

  const defaultKey = "sk-or-v1-............"
  const fallbackValue = userKeyStatus.openrouter ? defaultKey : ""
  const value = openRouterAPIKey || fallbackValue

  const saveMutation = useMutation({
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchClient("/api/user-keys", {
        method: "DELETE",
        body: JSON.stringify({
          provider: "openrouter",
        }),
      })
      if (!res.ok) throw new Error("Failed to delete key")
      return res
    },
    onSuccess: async () => {
      toast({
        title: "API key deleted",
        description: "Your API key has been deleted.",
      })
      await Promise.all([refreshUserKeyStatus(), refreshModels()])
      setOpenRouterAPIKey("")
      setDeleteDialogOpen(false)
    },
    onError: () => {
      toast({
        title: "Failed to delete API key",
        description: "Please try again.",
      })
      setDeleteDialogOpen(false)
    },
  })

  const handleConfirmDelete = () => {
    deleteMutation.mutate()
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
              disabled={saveMutation.isPending}
            />
            <div className="mt-0 flex justify-between pl-1">
              <a
                href="https://openrouter.ai/settings/keys"
                target="_blank"
                className="text-muted-foreground mt-1 text-xs hover:underline"
              >
                Get API key
              </a>
              <div className="flex gap-2">
                {userKeyStatus.openrouter && (
                  <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        disabled={
                          deleteMutation.isPending || saveMutation.isPending
                        }
                      >
                        <Trash2 className="mr-1 size-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete your OpenRouter API
                          key? This action cannot be undone and you will lose
                          access to OpenRouter models.
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
                )}
                <Button
                  onClick={() => saveMutation.mutate(value)}
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
    </div>
  )
}
