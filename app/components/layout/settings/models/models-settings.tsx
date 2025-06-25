"use client"

import { useModel } from "@/lib/model-store/provider"
import { ModelConfig } from "@/lib/models/types"
import { PROVIDERS } from "@/lib/providers"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import {
  DotsSixVerticalIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from "@phosphor-icons/react"
import { AnimatePresence, motion, Reorder } from "framer-motion"
import { useMemo, useState } from "react"
import { useFavoriteModels } from "./use-favorite-models"

type FavoriteModelItem = ModelConfig & {
  isFavorite: boolean
}

export function ModelsSettings() {
  const { models } = useModel()
  const { isModelHidden } = useUserPreferences()
  const [searchQuery, setSearchQuery] = useState("")

  // Use TanStack Query for favorite models with optimistic updates
  const {
    favoriteModels: currentFavoriteModels,
    updateFavoriteModels,
    updateFavoriteModelsDebounced,
  } = useFavoriteModels()

  // Create favorite models list with additional metadata
  const favoriteModels: FavoriteModelItem[] = useMemo(() => {
    if (!currentFavoriteModels || !Array.isArray(currentFavoriteModels)) {
      return []
    }

    return currentFavoriteModels
      .map((id: string) => {
        const model = models.find((m) => m.id === id)
        if (!model || isModelHidden(model.id)) return null
        return { ...model, isFavorite: true }
      })
      .filter(Boolean) as FavoriteModelItem[]
  }, [currentFavoriteModels, models, isModelHidden])

  // Available models that aren't favorites yet, filtered and grouped by provider
  const availableModelsByProvider = useMemo(() => {
    if (!currentFavoriteModels || !Array.isArray(currentFavoriteModels)) {
      return {}
    }

    const availableModels = models
      .filter(
        (model) =>
          !currentFavoriteModels.includes(model.id) && !isModelHidden(model.id)
      )
      .filter((model) =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase())
      )

    return availableModels.reduce(
      (acc, model) => {
        const iconKey = model.icon || "unknown"

        if (!acc[iconKey]) {
          acc[iconKey] = []
        }

        acc[iconKey].push(model)

        return acc
      },
      {} as Record<string, typeof models>
    )
  }, [models, currentFavoriteModels, isModelHidden, searchQuery])

  // Handle reorder - immediate state update with debounced API call
  const handleReorder = (newOrder: FavoriteModelItem[]) => {
    const newOrderIds = newOrder.map((item) => item.id)

    // Immediate optimistic update with debounced API call
    updateFavoriteModelsDebounced(newOrderIds)
  }

  const toggleFavorite = (modelId: string) => {
    if (!currentFavoriteModels || !Array.isArray(currentFavoriteModels)) {
      return
    }

    const isCurrentlyFavorite = currentFavoriteModels.includes(modelId)
    const newIds = isCurrentlyFavorite
      ? currentFavoriteModels.filter((id: string) => id !== modelId)
      : [...currentFavoriteModels, modelId]

    // Optimistic update - immediately updates UI
    updateFavoriteModels(newIds)
  }

  const removeFavorite = (modelId: string) => {
    if (!currentFavoriteModels || !Array.isArray(currentFavoriteModels)) {
      return
    }

    const newIds = currentFavoriteModels.filter((id: string) => id !== modelId)

    // Optimistic update - immediately updates UI
    updateFavoriteModels(newIds)
  }

  const getProviderIcon = (model: ModelConfig) => {
    const provider = PROVIDERS.find((p) => p.id === model.baseProviderId)
    return provider?.icon
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">Models</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          Reorder and manage the models shown in your selector.
        </p>
      </div>

      {/* Favorite Models - Drag and Drop List */}
      <div>
        <h4 className="mb-3 text-sm font-medium">
          Your favorites ({favoriteModels.length})
        </h4>
        <AnimatePresence initial={false}>
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
                  <Reorder.Item key={model.id} value={model} className="group">
                    <div className="bg-card border-border flex items-center gap-3 rounded-lg border p-3">
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
                        type="button"
                        disabled={favoriteModels.length <= 1}
                        className="text-muted-foreground rounded-md border p-1 opacity-0 transition-all group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          favoriteModels.length <= 1
                            ? "At least one favorite model is required"
                            : "Remove from favorites"
                        }
                      >
                        <MinusIcon className="size-4" />
                      </button>
                    </div>
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
        <p className="text-muted-foreground mb-4 text-sm">
          Choose models to add to your favorites.
        </p>

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

        {/* Models grouped by provider */}
        <div className="space-y-6 pb-6">
          {Object.entries(availableModelsByProvider).map(
            ([iconKey, modelsGroup]) => {
              const firstModel = modelsGroup[0]
              const provider = PROVIDERS.find((p) => p.id === firstModel.icon)

              return (
                <div key={iconKey} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {provider?.icon && <provider.icon className="size-5" />}
                    <h4 className="font-medium">{provider?.name || iconKey}</h4>
                    <span className="text-muted-foreground text-sm">
                      ({modelsGroup.length} models)
                    </span>
                  </div>

                  <div className="space-y-2 pl-7">
                    {modelsGroup.map((model) => {
                      const modelProvider = PROVIDERS.find(
                        (p) => p.id === model.provider
                      )

                      return (
                        <motion.div
                          key={model.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between py-1"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{model.name}</span>
                              <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs">
                                via {modelProvider?.name || model.provider}
                              </span>
                            </div>
                            {model.description && (
                              <span className="text-muted-foreground text-xs">
                                {model.description}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => toggleFavorite(model.id)}
                            type="button"
                            className="text-muted-foreground hover:text-foreground border-border rounded-md border p-1 transition-colors"
                            title="Add to favorites"
                          >
                            <PlusIcon className="size-4" />
                          </button>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            }
          )}
        </div>

        {Object.keys(availableModelsByProvider).length === 0 && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            {searchQuery
              ? `No models found matching "${searchQuery}"`
              : "No available models to add"}
          </div>
        )}
      </div>
    </div>
  )
}
