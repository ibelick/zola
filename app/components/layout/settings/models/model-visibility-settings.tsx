"use client"

import { Switch } from "@/components/ui/switch"
import { useModel } from "@/lib/model-store/provider"
import { PROVIDERS } from "@/lib/providers"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useState } from "react"

export function ModelVisibilitySettings() {
  const { models } = useModel()
  const { toggleModelVisibility, isModelHidden } = useUserPreferences()
  const [searchQuery, setSearchQuery] = useState("")
  const [optimisticStates, setOptimisticStates] = useState<
    Record<string, boolean>
  >({})

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const modelsByProvider = filteredModels.reduce(
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

  const handleToggle = (modelId: string) => {
    const currentState =
      optimisticStates[modelId] !== undefined
        ? optimisticStates[modelId]
        : !isModelHidden(modelId)

    setOptimisticStates((prev) => ({
      ...prev,
      [modelId]: !currentState,
    }))

    // Actual update
    toggleModelVisibility(modelId)
  }

  const getModelVisibility = (modelId: string) => {
    return optimisticStates[modelId] !== undefined
      ? optimisticStates[modelId]
      : !isModelHidden(modelId)
  }

  const handleGroupToggle = (modelsGroup: typeof models) => {
    const allVisible = modelsGroup.every((model) =>
      getModelVisibility(model.id)
    )

    const newState = !allVisible

    setOptimisticStates((prev) => {
      const newOptimisticStates = { ...prev }
      modelsGroup.forEach((model) => {
        newOptimisticStates[model.id] = newState
      })
      return newOptimisticStates
    })

    modelsGroup.forEach((model) => {
      const currentVisible =
        optimisticStates[model.id] !== undefined
          ? optimisticStates[model.id]
          : !isModelHidden(model.id)

      if (currentVisible !== newState) {
        toggleModelVisibility(model.id)
      }
    })
  }

  const getGroupVisibility = (modelsGroup: typeof models) => {
    const visibleCount = modelsGroup.filter((model) =>
      getModelVisibility(model.id)
    ).length

    if (visibleCount === 0) return false
    if (visibleCount === modelsGroup.length) return true
    return "indeterminate"
  }

  return (
    <div>
      <h3 className="mb-2 text-lg font-medium">Available models</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Choose which models appear in your model selector.
      </p>

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Models grouped by icon/type */}
      <div className="space-y-6 pb-6">
        {Object.entries(modelsByProvider).map(([iconKey, modelsGroup]) => {
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
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">All</span>
                  <Switch
                    checked={getGroupVisibility(modelsGroup) === true}
                    onCheckedChange={() => handleGroupToggle(modelsGroup)}
                    className={
                      getGroupVisibility(modelsGroup) === "indeterminate"
                        ? "opacity-60"
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 pl-7">
                {modelsGroup.map((model) => {
                  const modelProvider = PROVIDERS.find(
                    (p) => p.id === model.provider
                  )

                  return (
                    <div
                      key={model.id}
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
                      <Switch
                        checked={getModelVisibility(model.id)}
                        onCheckedChange={() => handleToggle(model.id)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-muted-foreground py-8 text-center text-sm">
          No models found matching your search.
        </div>
      )}
    </div>
  )
}
