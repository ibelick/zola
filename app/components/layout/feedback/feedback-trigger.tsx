"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useUser } from "@/app/providers/user-provider"
import { FeedbackForm } from "@/components/common/feedback-form"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { Question } from "@phosphor-icons/react"
import { useState } from "react"

export function FeedbackTrigger() {
  if (!isSupabaseEnabled) {
    return null
  }

  const { user } = useUser()
  const isMobile = useBreakpoint(768)
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => {
    setIsOpen(false)
  }

  const trigger = (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <Question className="size-4" />
      <span>Feedback</span>
    </DropdownMenuItem>
  )

  if (isMobile) {
    return (
      <>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent className="bg-background border-border">
            <FeedbackForm authUserId={user?.id} onClose={handleClose} />
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="[&>button:last-child]:bg-background overflow-hidden p-0 shadow-xs sm:max-w-md [&>button:last-child]:top-3.5 [&>button:last-child]:right-3 [&>button:last-child]:rounded-full [&>button:last-child]:p-1">
          <FeedbackForm authUserId={user?.id} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </>
  )
}
