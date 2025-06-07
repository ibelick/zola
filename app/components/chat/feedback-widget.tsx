"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { FeedbackForm } from "@/components/common/feedback-form"
import {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
} from "@/components/motion-primitives/morphing-popover"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { QuestionMark } from "@phosphor-icons/react"
import { motion } from "motion/react"
import { useState } from "react"

const TRANSITION_POPOVER = {
  type: "spring",
  bounce: 0.1,
  duration: 0.3,
}

type FeedbackWidgetProps = {
  authUserId?: string
}

export function FeedbackWidget({ authUserId }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobileOrTablet = useBreakpoint(896)

  if (!isSupabaseEnabled) {
    return null
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  if (isMobileOrTablet || !authUserId) {
    return null
  }

  return (
    <div className="fixed right-1 bottom-1 z-50">
      <MorphingPopover
        transition={TRANSITION_POPOVER}
        open={isOpen}
        onOpenChange={setIsOpen}
        className="relative flex flex-col items-end justify-end"
      >
        <MorphingPopoverTrigger
          className="border-border bg-background text-foreground hover:bg-secondary flex size-6 items-center justify-center rounded-full border shadow-md"
          style={{
            transformOrigin: "bottom right",
            originX: "right",
            originY: "bottom",
            scaleX: 1,
            scaleY: 1,
          }}
        >
          <span className="sr-only">Help</span>
          <motion.span
            animate={{
              opacity: isOpen ? 0 : 1,
            }}
            transition={{
              duration: 0,
              delay: isOpen ? 0 : TRANSITION_POPOVER.duration / 2,
            }}
          >
            <QuestionMark className="text-foreground size-4" />
          </motion.span>
        </MorphingPopoverTrigger>
        <MorphingPopoverContent
          className="border-border bg-popover fixed right-1 bottom-1 min-w-[320px] rounded-xl border p-0 shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)]"
          style={{
            transformOrigin: "bottom right",
          }}
        >
          <FeedbackForm authUserId={authUserId} onClose={closeMenu} />
        </MorphingPopoverContent>
      </MorphingPopover>
    </div>
  )
}
