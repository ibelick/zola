import { google, GoogleGenerativeAIProviderSettings } from "@ai-sdk/google"
import { mistral, MistralProviderSettings } from "@ai-sdk/mistral"
import { openai, OpenAIProviderSettings } from "@ai-sdk/openai"
import type { LanguageModelV1 } from "@ai-sdk/provider"
import { getProviderForModel } from "./provider-map"
import type { SupportedModel } from "./types"

type OpenProvidersOptions = Record<string, unknown> // TODO: improve per provider later

export function openproviders(
  modelId: SupportedModel,
  settings?: OpenProvidersOptions
): LanguageModelV1 {
  const provider = getProviderForModel(modelId)

  if (provider === "openai") return openai(modelId, settings)
  if (provider === "mistral") return mistral(modelId, settings)
  if (provider === "google") return google(modelId, settings)

  throw new Error(`Unsupported model: ${modelId}`)
}
