import {
  getTrinityModels,
  refreshTrinityModelsCache,
} from "@/lib/trinity/models"
import type { ModelConfig } from "./types"

let cachedModels: ModelConfig[] = []

export async function getAllModels(): Promise<ModelConfig[]> {
  cachedModels = await getTrinityModels()
  return cachedModels
}

export async function getModelsWithAccessFlags(): Promise<ModelConfig[]> {
  return getAllModels()
}

export async function getModelsForProvider(
  provider: string
): Promise<ModelConfig[]> {
  if (provider !== "trinity") return []
  return getAllModels()
}

export async function getModelsForUserProviders(
  _providers: string[]
): Promise<ModelConfig[]> {
  return getAllModels()
}

export function getModelInfo(modelId: string): ModelConfig | undefined {
  return cachedModels.find((model) => model.id === modelId)
}

export const MODELS: ModelConfig[] = []

export function refreshModelsCache(): void {
  cachedModels = []
  refreshTrinityModelsCache()
}
