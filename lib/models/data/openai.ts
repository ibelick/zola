import { openproviders } from "@/lib/openproviders"
import { ModelConfig } from "../types"

const neosantaraModels: ModelConfig[] = [
  {
    id: "nusantara-base",
    name: "Nusantara Base",
    provider: "Neosantara",
    providerId: "neosantara",
    modelFamily: "neosantaraai",
    baseProviderId: "neosantara",
    description: "Legacy GPT model for cheaper chat and non-chat tasks",
    tags: ["fast", "cheap", "chat"],
    contextWindow: 16385,
    inputCost: 0.5,
    outputCost: 1.5,
    priceUnit: "per 1M tokens",
    vision: false,
    tools: false,
    audio: false,
    openSource: false,
    speed: "Fast",
    website: "https://openai.com",
    apiDocs: "https://platform.openai.com/docs/models/gpt-3.5-turbo",
    modelPage: "https://platform.openai.com/docs/models/gpt-3.5-turbo",
    icon: "openai",
    apiSdk: (apiKey?: string) =>
      openproviders("nusantara-base", undefined, apiKey),
  },
  {
    id: "archipelago-7b",
    name: "Archipelago 7B",
    provider: "Neosantara",
    providerId: "neosantara",
    modelFamily: "neosantaraai",
    baseProviderId: "neosantara",
    description: "An older high-intelligence GPT model",
    tags: ["vision", "tools", "large-context"],
    contextWindow: 128000,
    inputCost: 10.0,
    outputCost: 30.0,
    priceUnit: "per 1M tokens",
    vision: true,
    tools: true,
    audio: false,
    openSource: false,
    speed: "Medium",
    website: "https://openai.com",
    apiDocs: "https://platform.openai.com/docs/models/gpt-4-turbo",
    modelPage: "https://platform.openai.com/docs/models/gpt-4-turbo",
    icon: "openai",
    apiSdk: (apiKey?: string) =>
      openproviders("archipelago-7b", undefined, apiKey),
  }
]

export { neosantaraModels }
