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
}

type ModelContextType = {
  models: ModelConfig[]
  userKeyStatus: UserKeyStatus
  isLoading: boolean
  refreshModels: () => Promise<void>
  refreshUserKeyStatus: () => Promise<void>
  refreshAll: () => Promise<void>
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [userKeyStatus, setUserKeyStatus] = useState<UserKeyStatus>({
    openrouter: false,
  })
  const [isLoading, setIsLoading] = useState(false)

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
      setUserKeyStatus({ openrouter: false })
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

  const refreshAll = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchModels(), fetchUserKeyStatus()])
    } finally {
      setIsLoading(false)
    }
  }, [fetchModels, fetchUserKeyStatus])

  // Initial data fetch
  useEffect(() => {
    refreshAll()
  }, []) // Only run once on mount

  return (
    <ModelContext.Provider
      value={{
        models,
        userKeyStatus,
        isLoading,
        refreshModels,
        refreshUserKeyStatus,
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
