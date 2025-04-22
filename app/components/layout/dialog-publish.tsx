"use client"

import { AgentHeader } from "@/app/components/layout/header"
import { useChatSession } from "@/app/providers/chat-session-provider"
import XIcon from "@/components/icons/x"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { APP_DOMAIN } from "@/lib/config"
import { createClient } from "@/lib/supabase/client"
import { Globe, Spinner } from "@phosphor-icons/react"
import type React from "react"
import { useState } from "react"

type DialogPublishProps = {
  agent: AgentHeader
}

export function DialogPublish({ agent }: DialogPublishProps) {
  const [openDialog, setOpenDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { chatId } = useChatSession()

  if (!chatId) {
    return null
  }

  const publicLink = `${APP_DOMAIN}/agents/${agent.slug}/${chatId}`

  const openPage = () => {
    setOpenDialog(false)

    window.open(publicLink, "_blank")
  }

  const shareOnX = () => {
    setOpenDialog(false)

    const X_TEXT = `Check out this public page I created with Zola! ${publicLink}`
    window.open(`https://x.com/intent/tweet?text=${X_TEXT}`, "_blank")
  }

  const handlePublish = async () => {
    setIsLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("chats")
      .update({ public: true })
      .eq("id", chatId)
      .select()
      .single()

    if (error) {
      console.error(error)
    }

    if (data) {
      setIsLoading(false)
      setOpenDialog(true)
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1.5 transition-colors"
              onClick={handlePublish}
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner className="size-5 animate-spin" />
              ) : (
                <Globe className="size-5" />
              )}
              <span className="sr-only">Make public</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Make public</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Your conversation is now public!</DialogTitle>
            <DialogDescription>
              Anyone with the link can now view this conversation and may appear
              in community feeds, featured pages, or search results in the
              future.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex items-center gap-1">
                <Input
                  id="slug"
                  value={publicLink}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={openPage} className="flex-1">
              View Page
            </Button>
            <Button onClick={shareOnX} className="flex-1">
              Share on <XIcon className="text-primary-foreground size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
