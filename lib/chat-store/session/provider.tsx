"use client"

import { usePathname } from "next/navigation"
import { createContext, useContext, useMemo } from "react"

const ChatSessionContext = createContext<{ chatId: string | null }>({
  chatId: null,
})

export const useChatSession = () => useContext(ChatSessionContext)

export function getChatIdFromPathname() {
  return window.location.pathname.split("/c/")[1]
}

export function ChatSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const chatId = useMemo(() => {
    if (pathname?.startsWith("/c/")) {
      const value = pathname.split("/c/")[1]
      // console.log("chaning pathname to", value)
      return value
    }
    // console.log("changing pathname to null", pathname)
    return null
  }, [pathname])

  return (
    <ChatSessionContext.Provider value={{ chatId }}>
      {children}
    </ChatSessionContext.Provider>
  )
}
