import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import { mistral } from "@ai-sdk/mistral"
import { openai } from "@ai-sdk/openai"
import type { LanguageModelV2 } from "@ai-sdk/provider"
import { xai } from "@ai-sdk/xai"
import { getProviderForModel } from "./provider-map"
import type {
  AnthropicModel,
  GeminiModel,
  MistralModel,
  OpenAIModel,
  SupportedModel,
  XaiModel,
} from "./types"

// type OpenAIChatSettings = Parameters<typeof openai>[1]
// type MistralProviderSettings = Parameters<typeof mistral>[1]
// type GoogleGenerativeAIProviderSettings = Parameters<typeof google>[1]
// type AnthropicProviderSettings = Parameters<typeof anthropic>[1]
// type XaiProviderSettings = Parameters<typeof xai>[1]

// type ModelSettings<T extends SupportedModel> = T extends OpenAIModel
//   ? OpenAIChatSettings
//   : T extends MistralModel
//     ? MistralProviderSettings
//     : T extends GeminiModel
//       ? GoogleGenerativeAIProviderSettings
//       : T extends AnthropicModel
//         ? AnthropicProviderSettings
//         : T extends XaiModel
//           ? XaiProviderSettings
//           : never

// export type OpenProvidersOptions<T extends SupportedModel> = ModelSettings<T>

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: any // FIX THIS
): LanguageModelV2 {
  const provider = getProviderForModel(modelId)

  if (provider === "openai") {
    return openai(modelId as OpenAIModel)
  }

  if (provider === "mistral") {
    return mistral(modelId as MistralModel)
  }

  if (provider === "google") {
    return google(modelId as GeminiModel)
  }

  if (provider === "anthropic") {
    return anthropic(modelId as AnthropicModel)
  }

  if (provider === "xai") {
    return xai(modelId as XaiModel)
  }

  throw new Error(`Unsupported model: ${modelId}`)
}
