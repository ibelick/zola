import useClickOutside from "@/components/motion-primitives/useClickOutside"
import { Button } from "@/components/ui/button"
import { Quote } from "lucide-react"
import { RefObject, useEffect, useRef, useState } from "react"

type QuoteButtonProps = {
  mousePosition: { x: number; y: number }
  onQuote: () => void
  messageContainerRef: RefObject<HTMLElement | null>
  onDismiss: () => void
}

export function QuoteButton({
  mousePosition,
  onQuote,
  messageContainerRef,
  onDismiss,
}: QuoteButtonProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLDivElement>(null)

  useClickOutside(buttonRef as RefObject<HTMLElement>, onDismiss)

  useEffect(() => {
    if (!messageContainerRef.current) return

    const containerRect = messageContainerRef.current.getBoundingClientRect()
    const buttonHeight = 60

    const top = mousePosition.y - containerRect.top - buttonHeight
    const left = mousePosition.x - containerRect.left

    setPosition({ top, left })
  }, [mousePosition, messageContainerRef])

  return (
    <div
      ref={buttonRef}
      className="absolute z-50 flex gap-2 rounded-full"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      <Button
        onClick={onQuote}
        className="flex size-10 items-center gap-1 rounded-full px-3 py-1 text-base"
        aria-label="Ask follow up"
      >
        <Quote className="size-4" />
      </Button>
    </div>
  )
}
