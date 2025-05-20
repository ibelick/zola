import { useEffect, useState } from 'react'

/**
 * Hook to manage persistent chat drafts using localStorage
 * @param chatId - The current chat ID (null for new chat)
 * @returns Object containing draft value and setter
 */
export function useChatDraft(chatId: string | null) {
  // Key for storing drafts in localStorage
  const storageKey = chatId ? `chat-draft-${chatId}` : 'chat-draft-new'
  
  // Initialize state from localStorage
  const [draftValue, setDraftValue] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(storageKey) || ''
  })

  // Update localStorage when draft changes
  useEffect(() => {
    if (draftValue) {
      localStorage.setItem(storageKey, draftValue)
    } else {
      localStorage.removeItem(storageKey)
    }
  }, [draftValue, storageKey])

  // Clear draft for the current chat
  const clearDraft = () => {
    setDraftValue('')
    localStorage.removeItem(storageKey)
  }

  return {
    draftValue,
    setDraftValue,
    clearDraft
  }
} 