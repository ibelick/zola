"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type LayoutType = "sidebar" | "fullscreen"

type UserPreferences = {
  layout: LayoutType
}

const defaultPreferences: UserPreferences = {
  layout: "sidebar",
}

const PREFERENCES_STORAGE_KEY = "user-preferences"
const LAYOUT_STORAGE_KEY = "preferred-layout"

interface UserPreferencesContextType {
  preferences: UserPreferences
  setLayout: (layout: LayoutType) => void
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (isInitialized) {
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
  }, [preferences, isInitialized])

  const setLayout = (layout: LayoutType) => {
    setPreferences((prev) => ({ ...prev, layout }))
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        setLayout,
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
