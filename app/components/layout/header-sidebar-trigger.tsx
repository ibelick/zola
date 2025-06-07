"use client"

import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SidebarSimple } from "@phosphor-icons/react"

type HeaderSidebarTriggerProps = React.HTMLAttributes<HTMLButtonElement>

export function HeaderSidebarTrigger({
  className,
  ...props
}: HeaderSidebarTriggerProps) {
  const { toggleSidebar, open, isMobile } = useSidebar()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "pointer-events-auto",
            "text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors",
            "-ml-5 inline-flex size-9 items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            isMobile ? "ml-0" : "-ml-5",
            className
          )}
          {...props}
        >
          <SidebarSimple size={20} />
          <span className="sr-only">Toggle sidebar</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>{open ? "Close sidebar" : "Open sidebar"}</TooltipContent>
    </Tooltip>
  )
}
