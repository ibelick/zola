"use client"

import { MultiChat } from "@/app/multi/multi-chat"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useState } from "react"
import { Chat } from "./chat"

// @todo: move all preferences in supabase and do server-side to avoid FOUC
function getInitialMultiModelEnabled(): boolean {
  if (typeof window === "undefined") return false

  try {
    const stored = localStorage.getItem("user-preferences")
    if (stored) {
      const preferences = JSON.parse(stored)
      return preferences.multiModelEnabled ?? false
    }
  } catch (error) {
    console.warn("Failed to read multiModelEnabled from localStorage:", error)
  }

  return false
}

export function ChatContainer() {
  const [initialMultiModelEnabled] = useState(getInitialMultiModelEnabled)
  const { preferences } = useUserPreferences()

  // Use preference store value, fallback to initial read for FOUC prevention
  const multiModelEnabled =
    preferences.multiModelEnabled ?? initialMultiModelEnabled

  if (multiModelEnabled) {
    return <MultiChat />
  }

  return <Chat />
}
