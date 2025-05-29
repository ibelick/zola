import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GlobeIcon } from "@phosphor-icons/react"
import React from "react"

type ButtonSearchProps = {
  isSelected?: boolean
  onToggle?: (isSelected: boolean) => void
}

export function ButtonSearch({
  isSelected = false,
  onToggle,
}: ButtonSearchProps) {
  const handleClick = () => {
    const newState = !isSelected
    onToggle?.(newState)
  }

  return (
    <Button
      variant="outline"
      className={cn(
        "rounded-full transition-all duration-150",
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
