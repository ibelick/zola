import { google } from "@ai-sdk/google"
import { mistral } from "@ai-sdk/mistral"
import { openai } from "@ai-sdk/openai"
import type { LanguageModelV1 } from "@ai-sdk/provider"
import { getProviderForModel } from "./provider-map"
import type {
  GeminiModel,
  MistralModel,
  OpenAIModel,
  SupportedModel,
} from "./types"

type OpenAIChatSettings = Parameters<typeof openai>[1]
type MistralProviderSettings = Parameters<typeof mistral>[1]
type GoogleGenerativeAIProviderSettings = Parameters<typeof google>[1]

// Union of all provider settings
export type OpenProvidersOptions =
  | OpenAIChatSettings
  | MistralProviderSettings
  | GoogleGenerativeAIProviderSettings

/**
 * Creates a language model instance from any supported provider (OpenAI, Mistral, Google).
 *
 * NOTE ON TYPE SAFETY:
 * The SDK functions expect model-specific settings types that aren't exported publicly.
 * We're forced to use 'as any' assertions because:
 * 1. Each provider function expects specific settings types (e.g., OpenAIChatSettings)
 * 2. These types aren't exported by their libraries so we can't use them directly
 * 3. Provider settings (OpenAIProviderSettings) are different from model settings
 *
 * This is a limitation of the current SDK design.
 */
export function openproviders(
  modelId: SupportedModel,
  settings?: OpenProvidersOptions
): LanguageModelV1 {
  const provider = getProviderForModel(modelId)

  if (provider === "openai") {
    return openai(modelId as OpenAIModel, settings as OpenAIChatSettings)
  }

  if (provider === "mistral") {
    // Type assertion required due to unexported MistralChatSettings
    return mistral(modelId as MistralModel, settings as MistralProviderSettings)
  }

  if (provider === "google") {
    // Type assertion required due to unexported GoogleGenerativeAISettings
    return google(
      modelId as GeminiModel,
      settings as GoogleGenerativeAIProviderSettings
    )
  }

  throw new Error(`Unsupported model: ${modelId}`)
}
