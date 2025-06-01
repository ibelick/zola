import { useState, useCallback, useRef, useEffect } from "react"

interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  created_at: string
}

interface ChatPreviewResponse {
  success: boolean
  messages: ChatMessage[]
  chatId: string
  error?: string
}

interface UseChatPreviewReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  fetchPreview: (chatId: string) => Promise<void>
  clearPreview: () => void
}

export function useChatPreview(): UseChatPreviewReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track current request to prevent race conditions
  const currentRequestRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPreview = useCallback(async (chatId: string) => {
    if (!chatId) return
    
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Debounce the request to prevent rapid-fire calls
    debounceTimeoutRef.current = setTimeout(async () => {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Set this as the current request
      currentRequestRef.current = chatId
      
      // Create new abort controller
      const controller = new AbortController()
      abortControllerRef.current = controller
      
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/chat-preview?chatId=${chatId}`, {
          signal: controller.signal
        })
        
        const data: ChatPreviewResponse = await response.json()

        // Only update state if this is still the current request
        if (currentRequestRef.current === chatId && !controller.signal.aborted) {
          if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`)
          }

          if (data.success) {
            setMessages(data.messages)
          } else {
            throw new Error(data.error || "Failed to fetch chat preview")
          }
        }
      } catch (err) {
        // Only update error state if this is still the current request and not aborted
        if (currentRequestRef.current === chatId && !controller.signal.aborted) {
          console.error("Error fetching chat preview:", err)
          setError(err instanceof Error ? err.message : "Unknown error occurred")
          setMessages([])
        }
      } finally {
        // Only update loading state if this is still the current request
        if (currentRequestRef.current === chatId && !controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 150) // 150ms debounce to prevent rapid calls
  }, [])

  const clearPreview = useCallback(() => {
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // Clear current request tracking
    currentRequestRef.current = null
    
    // Reset state
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    fetchPreview,
    clearPreview,
  }
} 