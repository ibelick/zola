"use client"

import { MultiChat } from "@/app/components/multi-chat/multi-chat"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { Chat } from "./chat"

export function ChatContainer() {
  const { preferences } = useUserPreferences()
  const multiModelEnabled = preferences.multiModelEnabled

  if (multiModelEnabled) {
    return <MultiChat />
  }

  return <Chat />
}
