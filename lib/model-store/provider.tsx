"use client"

import { fetchClient } from "@/lib/fetch"
import { ModelConfig } from "@/lib/models/types"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

type UserKeyStatus = {
  openrouter: boolean
  openai: boolean
  mistral: boolean
  google: boolean
  perplexity: boolean
  xai: boolean
  anthropic: boolean
  [key: string]: boolean // Allow for additional providers
}

type ModelContextType = {
  models: ModelConfig[]
  userKeyStatus: UserKeyStatus
  favoriteModels: string[]
  isLoading: boolean
  refreshModels: () => Promise<void>
  refreshUserKeyStatus: () => Promise<void>
  refreshFavoriteModels: () => Promise<void>
  refreshFavoriteModelsSilent: () => Promise<void>
  refreshAll: () => Promise<void>
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [userKeyStatus, setUserKeyStatus] = useState<UserKeyStatus>({
    openrouter: false,
    openai: false,
    mistral: false,
    google: false,
    perplexity: false,
    xai: false,
    anthropic: false,
  })
  const [favoriteModels, setFavoriteModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetchClient("/api/models")
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error("Failed to fetch models:", error)
    }
  }, [])

  const fetchUserKeyStatus = useCallback(async () => {
    try {
      const response = await fetchClient("/api/user-key-status")
      if (response.ok) {
        const data = await response.json()
        setUserKeyStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch user key status:", error)
      // Set default values on error
      setUserKeyStatus({
        openrouter: false,
        openai: false,
        mistral: false,
        google: false,
        perplexity: false,
        xai: false,
        anthropic: false,
      })
    }
  }, [])

  const fetchFavoriteModels = useCallback(async () => {
    try {
      const response = await fetchClient(
        "/api/user-preferences/favorite-models"
      )
      if (response.ok) {
        const data = await response.json()
        setFavoriteModels(data.favorite_models || [])
      }
    } catch (error) {
      console.error("Failed to fetch favorite models:", error)
      setFavoriteModels([])
    }
  }, [])

  const refreshModels = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchModels()
    } finally {
      setIsLoading(false)
    }
  }, [fetchModels])

  const refreshUserKeyStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchUserKeyStatus()
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserKeyStatus])

  const refreshFavoriteModels = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchFavoriteModels()
    } finally {
      setIsLoading(false)
    }
  }, [fetchFavoriteModels])

  const refreshFavoriteModelsSilent = useCallback(async () => {
    try {
      await fetchFavoriteModels()
    } catch (error) {
      console.error(
        "❌ ModelProvider: Failed to silently refresh favorite models:",
        error
      )
    }
  }, [fetchFavoriteModels])

  const refreshAll = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchModels(),
        fetchUserKeyStatus(),
        fetchFavoriteModels(),
      ])
    } finally {
      setIsLoading(false)
    }
  }, [fetchModels, fetchUserKeyStatus, fetchFavoriteModels])

  // Initial data fetch
  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  return (
    <ModelContext.Provider
      value={{
        models,
        userKeyStatus,
        favoriteModels,
        isLoading,
        refreshModels,
        refreshUserKeyStatus,
        refreshFavoriteModels,
        refreshFavoriteModelsSilent,
        refreshAll,
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}

// Custom hook to use the model context
export function useModel() {
  const context = useContext(ModelContext)
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider")
  }
  return context
}
