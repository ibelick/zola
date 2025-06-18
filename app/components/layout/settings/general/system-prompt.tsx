"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { useUser } from "@/lib/user-store/provider"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

export function SystemPromptSection() {
  const { user, updateUser } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState<string | null>(null)
  const effectivePrompt = prompt ?? user?.system_prompt ?? ""

  const savePrompt = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      await updateUser({ system_prompt: prompt })

      toast({
        title: "Prompt saved",
        description: "It'll be used for new chats.",
        status: "success",
      })
    } catch (error) {
      console.error("Error saving system prompt:", error)
      toast({
        title: "Failed to save",
        description: "Couldn't save your system prompt. Please try again.",
        status: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setPrompt(value)
  }

  const hasChanges = effectivePrompt !== (user?.system_prompt || "")

  return (
    <div>
      <Label htmlFor="system-prompt" className="mb-3 text-sm font-medium">
        Default system prompt
      </Label>
      <div className="relative">
        <Textarea
          id="system-prompt"
          className="min-h-24 w-full"
          placeholder="Enter a default system prompt for new conversations"
          value={effectivePrompt}
          onChange={handlePromptChange}
        />

        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 bottom-3"
            >
              <Button
                size="sm"
                onClick={savePrompt}
                className="shadow-sm"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save prompt"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        This prompt will be used for new chats.
      </p>
    </div>
  )
}
