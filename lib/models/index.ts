import { claudeModels } from "./data/claude"
import { deepseekModels } from "./data/deepseek"
import { grokModels } from "./data/grok"
import { mistralModels } from "./data/mistral"
import { ollamaModels, getOllamaModels } from "./data/ollama"
import { openaiModels } from "./data/openai"
import { ModelConfig } from "./types"

// Static models (always available)
export const STATIC_MODELS: ModelConfig[] = [
  ...openaiModels,
  ...mistralModels,
  ...deepseekModels,
  ...claudeModels,
  ...grokModels,
  ...ollamaModels, // Static fallback Ollama models

  // not ready
  // ...llamaModels,
]

// Dynamic models cache
let dynamicModelsCache: ModelConfig[] | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Function to get all models including dynamically detected ones
export async function getAllModels(): Promise<ModelConfig[]> {
  const now = Date.now()
  
  // Use cache if it's still valid
  if (dynamicModelsCache && (now - lastFetchTime) < CACHE_DURATION) {
    return dynamicModelsCache
  }

  try {
    // Get dynamically detected Ollama models
    const detectedOllamaModels = await getOllamaModels()
    
    // Combine static models (excluding static Ollama models) with detected ones
    const staticModelsWithoutOllama = STATIC_MODELS.filter(
      model => model.providerId !== "ollama"
    )
    
    dynamicModelsCache = [
      ...staticModelsWithoutOllama,
      ...detectedOllamaModels,
    ]
    
    lastFetchTime = now
    return dynamicModelsCache
  } catch (error) {
    console.warn("Failed to load dynamic models, using static models:", error)
    return STATIC_MODELS
  }
}

// Synchronous function to get model info for simple lookups
// This uses cached data if available, otherwise falls back to static models
export function getModelInfo(modelId: string): ModelConfig | undefined {
  // First check the cache if it exists
  if (dynamicModelsCache) {
    return dynamicModelsCache.find(model => model.id === modelId)
  }
  
  // Fall back to static models for immediate lookup
  return STATIC_MODELS.find(model => model.id === modelId)
}

// For backward compatibility - static models only
export const MODELS: ModelConfig[] = STATIC_MODELS

// Function to refresh the models cache
export function refreshModelsCache(): void {
  dynamicModelsCache = null
  lastFetchTime = 0
}
