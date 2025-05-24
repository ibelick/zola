import { claudeModels } from "./data/claude"
import { deepseekModels } from "./data/deepseek"
import { grokModels } from "./data/grok"
import { llamaModels } from "./data/llama"
import { mistralModels } from "./data/mistral"
import { openaiModels } from "./data/openai"
import { ModelConfig } from "./types"

export const MODELS: ModelConfig[] = [
  ...openaiModels,
  ...mistralModels,
  ...deepseekModels,
  ...claudeModels,
  ...grokModels,

  // not ready
  // ...llamaModels,
]
