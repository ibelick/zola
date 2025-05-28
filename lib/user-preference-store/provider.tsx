"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type LayoutType = "sidebar" | "fullscreen"

type UserPreferences = {
  layout: LayoutType
  promptSuggestions: boolean
}

const defaultPreferences: UserPreferences = {
  layout: "fullscreen",
  promptSuggestions: true,
}

const PREFERENCES_STORAGE_KEY = "user-preferences"
const LAYOUT_STORAGE_KEY = "preferred-layout"

interface UserPreferencesContextType {
  preferences: UserPreferences
  setLayout: (layout: LayoutType) => void
  setPromptSuggestions: (enabled: boolean) => void
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

export function UserPreferencesProvider({
  children,
  userId,
}: {
  children: React.ReactNode
  userId?: string
}) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences)
  const [isInitialized, setIsInitialized] = useState(false)
  const isAuthenticated = !!userId

  useEffect(() => {
    if (!isAuthenticated) {
      setPreferences((prev) => ({ ...prev, layout: "fullscreen" }))
      setIsInitialized(true)
      return
    }

    try {
      const storedPrefs = localStorage.getItem(PREFERENCES_STORAGE_KEY)

      if (storedPrefs) {
        setPreferences(JSON.parse(storedPrefs))
      } else {
        const storedLayout = localStorage.getItem(
          LAYOUT_STORAGE_KEY
        ) as LayoutType
        if (storedLayout) {
          setPreferences((prev) => ({ ...prev, layout: storedLayout }))
        }
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error)
    } finally {
      setIsInitialized(true)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      try {
        localStorage.setItem(
          PREFERENCES_STORAGE_KEY,
          JSON.stringify(preferences)
        )
        localStorage.setItem(LAYOUT_STORAGE_KEY, preferences.layout)
      } catch (error) {
        console.error("Failed to save user preferences:", error)
      }
    }
  }, [preferences, isInitialized, isAuthenticated])

  const setLayout = (layout: LayoutType) => {
    if (isAuthenticated || layout === "fullscreen") {
      setPreferences((prev) => ({ ...prev, layout }))
    }
  }

  const setPromptSuggestions = (enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, promptSuggestions: enabled }))
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        setLayout,
        setPromptSuggestions,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    )
  }
  return context
}
