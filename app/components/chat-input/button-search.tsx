import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GlobeIcon } from "@phosphor-icons/react"
import React from "react"
import { PopoverContentAuth } from "./popover-content-auth"

type ButtonSearchProps = {
  isSelected?: boolean
  onToggle?: (isSelected: boolean) => void
  isAuthenticated: boolean
}

export function ButtonSearch({
  isSelected = false,
  onToggle,
  isAuthenticated,
}: ButtonSearchProps) {
  const handleClick = () => {
    const newState = !isSelected
    onToggle?.(newState)
  }

  if (!isAuthenticated) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="border-border dark:bg-secondary rounded-full border bg-transparent"
          >
            <GlobeIcon className="size-5" />
            Search
          </Button>
        </PopoverTrigger>
        <PopoverContentAuth />
      </Popover>
    )
  }

  return (
    <Button
      variant="secondary"
      className={cn(
        "border-border dark:bg-secondary rounded-full border bg-transparent transition-all duration-150",
        isSelected &&
          "border-[#0091FF]/20 bg-[#E5F3FE] text-[#0091FF] hover:bg-[#E5F3FE] hover:text-[#0091FF]"
      )}
      onClick={handleClick}
    >
      <GlobeIcon className="size-5" />
      Search
    </Button>
  )
}
