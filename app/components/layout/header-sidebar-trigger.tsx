"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { List } from "@phosphor-icons/react"

interface HeaderSidebarTriggerProps
  extends React.HTMLAttributes<HTMLButtonElement> {}

export function HeaderSidebarTrigger({
  className,
  ...props
}: HeaderSidebarTriggerProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring -ml-5 inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      <List className="size-5" />
      <span className="sr-only">Toggle sidebar</span>
    </button>
  )
}
