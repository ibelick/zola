"use client"

import { MultiChat } from "@/app/components/multi-chat/multi-chat"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import type { Message as MessageAISDK } from "ai"
import { Chat } from "./chat"

export function ChatContainer({
  initialMessages,
  autoResume,
}: {
  initialMessages?: MessageAISDK[]
  autoResume?: boolean
}) {
  const { preferences } = useUserPreferences()
  const multiModelEnabled = preferences.multiModelEnabled

  if (multiModelEnabled) {
    return <MultiChat />
  }

  return <Chat autoResume={autoResume} initialMessages={initialMessages} />
}
