"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Globe } from "@phosphor-icons/react"
import type React from "react"
import { useEffect, useState } from "react"

type PublishDialogProps = {
  defaultTitle?: string
}

// Preview link button after generation (e.g. "View Page")
// Share on X / Copy Link CTA immediately after, for instant sharing
export function PublishDialog({
  defaultTitle = "How solo French founders use AI to scale in 2025",
}: PublishDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(defaultTitle)
  const [slug, setSlug] = useState("")

  // Generate slug from title
  useEffect(() => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    setSlug(generatedSlug)
  }, [title])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleSubmit = () => {
    // Handle form submission
    console.log("Generating public page with:", { title, slug })
    setOpen(false)
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
              onClick={() => setOpen(true)}
            >
              <Globe className="size-5" />
              <span className="sr-only">Make public</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Make public</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Make public</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="font-normal">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter a title for your research"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug" className="font-normal">
                URL preview
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="slug"
                  value={`/r/${slug}`}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
              </div>
            </div>
            {/* 
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="research" className="text-sm font-normal">
                  Original research query
                </Label>
                <Switch id="research" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="summary" className="text-sm font-normal">
                  Agent response summary
                </Label>
                <Switch id="summary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sources" className="text-sm font-normal">
                  Sources
                </Label>
                <Switch id="sources" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="conversation" className="text-sm font-normal">
                  Include entire conversation
                </Label>
                <Switch id="conversation" />
              </div>
            </div> */}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} className="w-full">
              Make Public
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
