import { createOpenAI } from "@ai-sdk/openai"
import type { ModelConfig } from "@/lib/models/types"

type TrinityModelsResponse = {
  data?: Array<{ id?: string }>
}

const CACHE_DURATION_MS = 5 * 60 * 1000
const FAMILY_ORDER = ["deepseek", "gemini", "glm", "gpt"] as const

export const TRINITY_MODEL_IDS = [
  "deepseek-v4-pro",
  "deepseek-v3.2",
  "gemini-3.1-pro-preview",
  "gemini-2.5-pro",
  "glm-5.2",
  "glm-5.1",
  "gpt-5.5",
  "gpt-5.4",
] as const

let cachedModels: ModelConfig[] | null = null
let cacheExpiresAt = 0

function getTrinityBaseUrl(): string {
  return (process.env.TRINITY_BASE_URL || "https://api.trinitydesk.ai/v1").replace(
    /\/+$/,
    ""
  )
}

function getTrinityApiKey(): string {
  const apiKey = process.env.TRINITY_API_KEY
  if (!apiKey) {
    throw new Error("TRINITY_API_KEY is not configured")
  }
  return apiKey
}

function getFamily(modelId: string): (typeof FAMILY_ORDER)[number] | null {
  const normalized = modelId.toLowerCase()
  if (normalized.includes("deepseek")) return "deepseek"
  if (normalized.includes("gemini")) return "gemini"
  if (normalized.includes("glm")) return "glm"
  if (normalized.startsWith("gpt")) return "gpt"
  return null
}

export function selectTrinityModelIds(modelIds: string[]): string[] {
  const availableModelIds = new Set(modelIds)
  return TRINITY_MODEL_IDS.filter((modelId) => availableModelIds.has(modelId))
}

function createTrinityModel(modelId: string): ModelConfig {
  const family = getFamily(modelId)
  const familyName = family === "gpt" ? "GPT" : family?.toUpperCase()

  return {
    id: modelId,
    name: `${familyName} · ${modelId}`,
    provider: "Trinity",
    providerId: "trinity",
    baseProviderId: "trinity",
    modelFamily: familyName,
    description: `Curated ${familyName} model available through Trinity`,
    tags: [familyName?.toLowerCase() || "trinity"],
    apiSdk: () =>
      createOpenAI({
        baseURL: getTrinityBaseUrl(),
        apiKey: getTrinityApiKey(),
        name: "trinity",
      })(modelId),
    accessible: true,
  }
}

export async function getTrinityModels(): Promise<ModelConfig[]> {
  if (cachedModels && Date.now() < cacheExpiresAt) return cachedModels

  const response = await fetch(`${getTrinityBaseUrl()}/models`, {
    headers: {
      Authorization: `Bearer ${getTrinityApiKey()}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Trinity model directory request failed with ${response.status}`)
  }

  const payload = (await response.json()) as TrinityModelsResponse
  const modelIds = payload.data
    ?.map((model) => model.id)
    .filter((modelId): modelId is string => Boolean(modelId))

  if (!modelIds?.length) {
    throw new Error("Trinity model directory returned no models")
  }

  const selectedModelIds = selectTrinityModelIds(modelIds)
  const missingModelIds = TRINITY_MODEL_IDS.filter(
    (modelId) => !selectedModelIds.includes(modelId)
  )

  if (missingModelIds.length > 0) {
    throw new Error(
      `Trinity model directory is missing configured models: ${missingModelIds.join(", ")}`
    )
  }

  cachedModels = selectedModelIds.map(createTrinityModel)
  cacheExpiresAt = Date.now() + CACHE_DURATION_MS

  return cachedModels
}

export function refreshTrinityModelsCache(): void {
  cachedModels = null
  cacheExpiresAt = 0
}
