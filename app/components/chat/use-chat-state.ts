import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type UseChatStateProps = {
  setInput: (input: string) => void
}

export function useChatState({ setInput }: UseChatStateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const [enableSearch, setEnableSearch] = useState(false)

  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  // Handle search params on mount
  useEffect(() => {
    if (prompt && typeof window !== "undefined") {
      requestAnimationFrame(() => setInput(prompt))
    }
  }, [prompt, setInput])

  return {
    isSubmitting,
    setIsSubmitting,
    hasDialogAuth,
    setHasDialogAuth,
    enableSearch,
    setEnableSearch,
  }
}
