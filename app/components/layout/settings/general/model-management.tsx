"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FREE_MODELS_IDS } from "@/lib/config"
import { fetchClient } from "@/lib/fetch"
import { ModelConfig } from "@/lib/models/types"
import { PROVIDERS } from "@/lib/providers"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { cn } from "@/lib/utils"
import { 
  Check, 
  Warning, 
  MagnifyingGlass, 
  Star,
  Eye,
  Wrench,
  Brain
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"

type ModelManagementProps = {
  isDrawer?: boolean
}

export function ModelManagement({ isDrawer = false }: ModelManagementProps) {
  const { preferences, setEnabledModels } = useUserPreferences()
  const [models, setModels] = useState<ModelConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true)
        const response = await fetchClient("/api/models")
        if (!response.ok) {
          throw new Error("Failed to fetch models")
        }
        const data = await response.json()
        setModels(data.models || [])
      } catch (error) {
        console.error("Failed to load models:", error)
        setModels([])
      } finally {
        setIsLoading(false)
      }
    }

    loadModels()
  }, [])

  // Get currently enabled models (null means all enabled)
  const enabledModelIds = preferences.enabledModels || models.map(model => model.id)
  
  const handleModelToggle = (modelId: string, checked: boolean) => {
    let newEnabledModels: string[]
    
    if (checked) {
      newEnabledModels = [...enabledModelIds, modelId]
    } else {
      newEnabledModels = enabledModelIds.filter(id => id !== modelId)
    }
    
    if (newEnabledModels.length === 0) {
      return // Don't allow disabling all models
    }
    
    setEnabledModels(newEnabledModels)
  }

  const handleSelectAll = () => {
    setEnabledModels(models.map(model => model.id))
  }

  const handleDeselectAll = () => {
    if (models.length > 0) {
      setEnabledModels([models[0].id])
    }
  }

  // Filter models by search query
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.provider.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group models by provider
  const groupedModels = filteredModels.reduce((acc, model) => {
    const provider = model.provider
    if (!acc[provider]) {
      acc[provider] = []
    }
    acc[provider].push(model)
    return acc
  }, {} as Record<string, ModelConfig[]>)

  const getCapabilityBadges = (model: ModelConfig) => {
    const badges = []
    
    if (model.vision) badges.push(
      <Badge key="vision" variant="secondary" className="text-xs">
        <Eye className="size-3 mr-1" />
        Vision
      </Badge>
    )
    
    if (model.tools) badges.push(
      <Badge key="tools" variant="secondary" className="text-xs">
        <Wrench className="size-3 mr-1" />
        Tools
      </Badge>
    )
    
    if (model.reasoning) badges.push(
      <Badge key="reasoning" variant="secondary" className="text-xs">
        <Brain className="size-3 mr-1" />
        Reasoning
      </Badge>
    )

    return badges
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Available Models</h3>
          <p className="text-muted-foreground text-xs">Loading models...</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-16 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const allModelsEnabled = preferences.enabledModels === null || enabledModelIds.length === models.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium">Available Models</h3>
        <p className="text-muted-foreground text-xs">
          Choose which models appear in your model selector. At least one model must be enabled.
        </p>
      </div>

      {/* Search and Controls */}
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlass className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2 size-4" />
          <Input
            placeholder="Search models and providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={allModelsEnabled}
            >
              Select All
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={enabledModelIds.length <= 1}
                  >
                    Unselect All
                  </Button>
                </div>
              </TooltipTrigger>
              {enabledModelIds.length <= 1 && (
                <TooltipContent>
                  <p>Must have at least one model selected</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
          
          {!isDrawer && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="size-3" />
              <span>{enabledModelIds.length} of {models.length} enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Model Groups */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {Object.entries(groupedModels).map(([providerName, providerModels]) => {
          const provider = PROVIDERS.find(p => p.name === providerName)
          const enabledInGroup = providerModels.filter(model => enabledModelIds.includes(model.id)).length
          
          return (
            <div key={providerName} className="space-y-2">
              {/* Provider Header */}
              <div className="flex items-center gap-2 px-1">
                {provider?.icon && <provider.icon className="size-4" />}
                <span className="text-xs font-medium text-muted-foreground">{providerName}</span>
                <Badge variant="outline" className="text-xs h-5">
                  {enabledInGroup}/{providerModels.length}
                </Badge>
              </div>
              
              {/* Provider Models */}
              <div className="space-y-2">
                {providerModels.map((model) => {
                  const isEnabled = enabledModelIds.includes(model.id)
                  const isLastEnabled = enabledModelIds.length === 1 && isEnabled
                  const isFree = FREE_MODELS_IDS.includes(model.id) || model.providerId === "ollama"
                  const modelProvider = PROVIDERS.find(p => p.id === model.providerId)
                  
                  return (
                    <div key={model.id} className={cn(
                      "border rounded-md p-3 transition-all hover:bg-muted/50",
                      isEnabled ? "bg-muted/30 border-primary/30" : "border-border"
                    )}>
                      <div className="flex items-start gap-3">
                        {isLastEnabled ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Checkbox
                                  id={`model-${model.id}`}
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                                  disabled={isLastEnabled}
                                  className="mt-0.5"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Must have at least one model selected</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Checkbox
                            id={`model-${model.id}`}
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                            disabled={isLastEnabled}
                            className="mt-0.5"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {modelProvider?.icon && <modelProvider.icon className="size-4" />}
                              <Label
                                htmlFor={`model-${model.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {model.name}
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {!isFree && (
                                <div className="border-input bg-accent text-muted-foreground flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                                  <span>Pro</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {model.description && (
                            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                              {model.description}
                            </p>
                          )}
                          
                          {/* Capabilities */}
                          <div className="flex flex-wrap gap-1">
                            {getCapabilityBadges(model)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {providerName !== Object.keys(groupedModels)[Object.keys(groupedModels).length - 1] && (
                <Separator className="my-4" />
              )}
            </div>
          )
        })}
      </div>

      {filteredModels.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <MagnifyingGlass className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No models found matching "{searchQuery}"</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  )
} 