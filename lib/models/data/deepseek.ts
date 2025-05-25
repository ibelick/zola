import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { ModelConfig } from "../types"

const deepseekModels: ModelConfig[] = [
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",

    providerId: "deepseek",
    modelFamily: "DeepSeek",
    description:
      "Flagship model by DeepSeek, optimized for performance and reliability.",
    tags: ["flagship", "reasoning", "performance", "reliability"],
    contextWindow: 64000,
    inputCost: 0.14,
    outputCost: 0.28,
    priceUnit: "per 1M tokens",
    vision: false,
    tools: true,
    audio: false,
    reasoning: true,
    openSource: false,
    speed: "Medium",
    intelligence: "High",
    website: "https://deepseek.com",
    apiDocs: "https://platform.deepseek.com/api-docs",
    modelPage: "https://deepseek.com",
    releasedAt: "2024-04-01",
    apiSdk: () =>
      createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      }).chat("deepseek/deepseek-r1:free"),
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    provider: "DeepSeek",
    providerId: "deepseek",
    modelFamily: "DeepSeek",
    description: "Smaller open-weight DeepSeek model for casual or hobby use.",
    tags: ["open-source", "smaller", "hobby", "research"],
    contextWindow: 32768,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "per 1M tokens",
    vision: false,
    tools: true,
    audio: false,
    reasoning: true,
    openSource: true,
    speed: "Fast",
    intelligence: "Medium",
    website: "https://deepseek.com",
    apiDocs: "https://github.com/deepseek-ai/deepseek",
    modelPage: "https://github.com/deepseek-ai",
    releasedAt: "2024-12-26",
    apiSdk: () =>
      createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      }).chat("deepseek-v3"),
  },
]

export { deepseekModels }
