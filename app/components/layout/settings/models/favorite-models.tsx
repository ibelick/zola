"use client"

import { useModel } from "@/lib/model-store/provider"
import { ModelConfig } from "@/lib/models/types"
import { PROVIDERS } from "@/lib/providers"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { DotsSixVerticalIcon, StarIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion, Reorder } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

interface FavoriteModelItem extends ModelConfig {
  isFavorite: boolean
}

export function FavoriteModels() {
  const { models } = useModel()
  const { isModelHidden } = useUserPreferences()
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Initialize with some default favorites for demo
  useEffect(() => {
    if (models.length > 0 && favoriteModelIds.length === 0) {
      const defaultFavorites = models
        .filter((model) => !isModelHidden(model.id))
        .slice(0, 5)
        .map((model) => model.id)
      setFavoriteModelIds(defaultFavorites)
    }
  }, [models, favoriteModelIds.length, isModelHidden])

  // Create favorite models list with additional metadata
  const favoriteModels: FavoriteModelItem[] = useMemo(() => {
    return favoriteModelIds
      .map((id) => {
        const model = models.find((m) => m.id === id)
        if (!model || isModelHidden(model.id)) return null
        return { ...model, isFavorite: true }
      })
      .filter(Boolean) as FavoriteModelItem[]
  }, [favoriteModelIds, models, isModelHidden])

  // Available models that aren't favorites yet
  const availableModels = useMemo(() => {
    return models
      .filter(
        (model) =>
          !favoriteModelIds.includes(model.id) && !isModelHidden(model.id)
      )
      .filter((model) =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((model) => ({ ...model, isFavorite: false }))
  }, [models, favoriteModelIds, isModelHidden, searchQuery])

  const handleReorder = (newOrder: FavoriteModelItem[]) => {
    setFavoriteModelIds(newOrder.map((item) => item.id))
  }

  const toggleFavorite = (modelId: string) => {
    setFavoriteModelIds((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId)
      } else {
        return [...prev, modelId]
      }
    })
  }

  const removeFavorite = (modelId: string) => {
    setFavoriteModelIds((prev) => prev.filter((id) => id !== modelId))
  }

  const getProviderIcon = (model: ModelConfig) => {
    const provider = PROVIDERS.find(
      (p) => p.id === model.icon || p.id === model.providerId
    )
    return provider?.icon
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">Favorite models</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Reorder and manage the models shown in your selector
        </p>
      </div>

      {/* Favorite Models - Drag and Drop List */}
      <div>
        <h4 className="mb-3 text-sm font-medium">
          Your favorites ({favoriteModels.length})
        </h4>
        <AnimatePresence>
          {favoriteModels.length > 0 ? (
            <Reorder.Group
              axis="y"
              values={favoriteModels}
              onReorder={handleReorder}
              className="space-y-2"
            >
              {favoriteModels.map((model) => {
                const ProviderIcon = getProviderIcon(model)
                return (
                  <Reorder.Item
                    key={model.id}
                    value={model}
                    className="group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div className="bg-card border-border flex items-center gap-3 rounded-lg border p-3">
                      {/* Drag Handle */}
                      <div className="text-muted-foreground cursor-grab opacity-60 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                        <DotsSixVerticalIcon className="size-4" />
                      </div>

                      {/* Provider Icon */}
                      {ProviderIcon && (
                        <ProviderIcon className="size-5 shrink-0" />
                      )}

                      {/* Model Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {model.name}
                          </span>
                          <div className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                            {model.provider}
                          </div>
                        </div>
                        {model.description && (
                          <p className="text-muted-foreground mt-1 truncate text-xs">
                            {model.description}
                          </p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFavorite(model.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 transition-all group-hover:opacity-100"
                        title="Remove from favorites"
                      >
                        <StarIcon className="size-4 fill-current" />
                      </button>
                    </motion.div>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-border text-muted-foreground flex h-32 items-center justify-center rounded-lg border-2 border-dashed"
            >
              <div className="text-center">
                <StarIcon className="mx-auto mb-2 size-8 opacity-50" />
                <p className="text-sm">No favorite models yet</p>
                <p className="text-xs">Add models from the list below</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Available Models */}
      <div>
        <h4 className="mb-3 text-sm font-medium">Available models</h4>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Available Models List */}
        <div className="max-h-64 space-y-2 overflow-y-auto">
          <AnimatePresence>
            {availableModels.map((model) => {
              const ProviderIcon = getProviderIcon(model)
              return (
                <motion.div
                  key={model.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {ProviderIcon && (
                      <ProviderIcon className="size-4 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {model.name}
                        </span>
                        <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                          {model.provider}
                        </span>
                      </div>
                      {model.description && (
                        <span className="text-muted-foreground text-xs">
                          {model.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    onClick={() => toggleFavorite(model.id)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                  >
                    <StarIcon className="size-3" />
                    Add
                  </motion.button>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {availableModels.length === 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground py-8 text-center text-sm"
            >
              No models found matching "{searchQuery}"
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
