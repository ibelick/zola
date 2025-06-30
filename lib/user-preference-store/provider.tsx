"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, ReactNode, useContext } from "react"

export type LayoutType = "sidebar" | "fullscreen"

type UserPreferences = {
  layout: LayoutType
  promptSuggestions: boolean
  showToolInvocations: boolean
  showConversationPreviews: boolean
  multiModelEnabled: boolean
  hiddenModels: string[]
}

const defaultPreferences: UserPreferences = {
  layout: "fullscreen",
  promptSuggestions: true,
  showToolInvocations: true,
  showConversationPreviews: true,
  multiModelEnabled: false,
  hiddenModels: [],
}

const PREFERENCES_STORAGE_KEY = "user-preferences"
const LAYOUT_STORAGE_KEY = "preferred-layout"

interface UserPreferencesContextType {
  preferences: UserPreferences
  setLayout: (layout: LayoutType) => void
  setPromptSuggestions: (enabled: boolean) => void
  setShowToolInvocations: (enabled: boolean) => void
  setShowConversationPreviews: (enabled: boolean) => void
  setMultiModelEnabled: (enabled: boolean) => void
  toggleModelVisibility: (modelId: string) => void
  isModelHidden: (modelId: string) => boolean
  isLoading: boolean
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

// Helper functions to convert between API format (snake_case) and frontend format (camelCase)
function convertFromApiFormat(apiData: any): UserPreferences {
  return {
    layout: apiData.layout || "fullscreen",
    promptSuggestions: apiData.prompt_suggestions ?? true,
    showToolInvocations: apiData.show_tool_invocations ?? true,
    showConversationPreviews: apiData.show_conversation_previews ?? true,
    multiModelEnabled: apiData.multi_model_enabled ?? false,
    hiddenModels: apiData.hidden_models || [],
  }
}

function convertToApiFormat(preferences: Partial<UserPreferences>) {
  const apiData: any = {}
  if (preferences.layout !== undefined) apiData.layout = preferences.layout
  if (preferences.promptSuggestions !== undefined)
    apiData.prompt_suggestions = preferences.promptSuggestions
  if (preferences.showToolInvocations !== undefined)
    apiData.show_tool_invocations = preferences.showToolInvocations
  if (preferences.showConversationPreviews !== undefined)
    apiData.show_conversation_previews = preferences.showConversationPreviews
  if (preferences.multiModelEnabled !== undefined)
    apiData.multi_model_enabled = preferences.multiModelEnabled
  if (preferences.hiddenModels !== undefined)
    apiData.hidden_models = preferences.hiddenModels
  return apiData
}

async function fetchUserPreferences(): Promise<UserPreferences> {
  const response = await fetch("/api/user-preferences")
  if (!response.ok) {
    throw new Error("Failed to fetch user preferences")
  }
  const data = await response.json()
  return convertFromApiFormat(data)
}

async function updateUserPreferences(
  update: Partial<UserPreferences>
): Promise<UserPreferences> {
  const response = await fetch("/api/user-preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(convertToApiFormat(update)),
  })

  if (!response.ok) {
    throw new Error("Failed to update user preferences")
  }

  const data = await response.json()
  return convertFromApiFormat(data)
}

function getLocalStoragePreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultPreferences

  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // fallback to legacy layout storage if JSON parsing fails
    }
  }

  const layout = localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType | null
  return {
    ...defaultPreferences,
    ...(layout ? { layout } : {}),
  }
}

function saveToLocalStorage(preferences: UserPreferences) {
  if (typeof window === "undefined") return

  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  localStorage.setItem(LAYOUT_STORAGE_KEY, preferences.layout)
}

export function UserPreferencesProvider({
  children,
  userId,
}: {
  children: ReactNode
  userId?: string
}) {
  const isAuthenticated = !!userId
  const queryClient = useQueryClient()

  // Query for user preferences
  const { data: preferences = defaultPreferences, isLoading } =
    useQuery<UserPreferences>({
      queryKey: ["user-preferences", userId],
      queryFn: async () => {
        if (!isAuthenticated) {
          return getLocalStoragePreferences()
        }

        try {
          return await fetchUserPreferences()
        } catch (error) {
          console.error(
            "Failed to fetch user preferences, falling back to localStorage:",
            error
          )
          return getLocalStoragePreferences()
        }
      },
      enabled: typeof window !== "undefined",
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Only retry for authenticated users and network errors
        return isAuthenticated && failureCount < 2
      },
    })

  // Mutation for updating preferences
  const mutation = useMutation({
    mutationFn: async (update: Partial<UserPreferences>) => {
      const updated = { ...preferences, ...update }

      if (!isAuthenticated) {
        saveToLocalStorage(updated)
        return updated
      }

      try {
        return await updateUserPreferences(update)
      } catch (error) {
        console.error(
          "Failed to update user preferences in database, falling back to localStorage:",
          error
        )
        saveToLocalStorage(updated)
        return updated
      }
    },
    onMutate: async (update) => {
      const queryKey = ["user-preferences", userId]
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<UserPreferences>(queryKey)
      const optimistic = { ...previous, ...update }
      queryClient.setQueryData(queryKey, optimistic)

      return { previous }
    },
    onError: (_err, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["user-preferences", userId], context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-preferences", userId], data)
    },
  })

  const updatePreferences = mutation.mutate

  const setLayout = (layout: LayoutType) => {
    if (isAuthenticated || layout === "fullscreen") {
      updatePreferences({ layout })
    }
  }

  const setPromptSuggestions = (enabled: boolean) => {
    updatePreferences({ promptSuggestions: enabled })
  }

  const setShowToolInvocations = (enabled: boolean) => {
    updatePreferences({ showToolInvocations: enabled })
  }

  const setShowConversationPreviews = (enabled: boolean) => {
    updatePreferences({ showConversationPreviews: enabled })
  }

  const setMultiModelEnabled = (enabled: boolean) => {
    updatePreferences({ multiModelEnabled: enabled })
  }

  const toggleModelVisibility = (modelId: string) => {
    const currentHidden = preferences.hiddenModels || []
    const isHidden = currentHidden.includes(modelId)
    const newHidden = isHidden
      ? currentHidden.filter((id) => id !== modelId)
      : [...currentHidden, modelId]

    updatePreferences({ hiddenModels: newHidden })
  }

  const isModelHidden = (modelId: string) => {
    return (preferences.hiddenModels || []).includes(modelId)
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        setLayout,
        setPromptSuggestions,
        setShowToolInvocations,
        setShowConversationPreviews,
        setMultiModelEnabled,
        toggleModelVisibility,
        isModelHidden,
        isLoading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    )
  }
  return context
}
