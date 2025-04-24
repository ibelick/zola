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

type ModelSettings<T extends SupportedModel> = T extends OpenAIModel
  ? OpenAIChatSettings
  : T extends MistralModel
    ? MistralProviderSettings
    : T extends GeminiModel
      ? GoogleGenerativeAIProviderSettings
      : never

export type OpenProvidersOptions<T extends SupportedModel> = ModelSettings<T>

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: OpenProvidersOptions<T>
): LanguageModelV1 {
  const provider = getProviderForModel(modelId)

  if (provider === "openai") {
    return openai(modelId as OpenAIModel, settings as OpenAIChatSettings)
  }

  if (provider === "mistral") {
    return mistral(modelId as MistralModel, settings as MistralProviderSettings)
  }

  if (provider === "google") {
    return google(
      modelId as GeminiModel,
      settings as GoogleGenerativeAIProviderSettings
    )
  }

  throw new Error(`Unsupported model: ${modelId}`)
}
