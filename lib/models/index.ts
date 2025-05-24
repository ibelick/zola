import { mistralModels } from "./data/mistral"
import { openaiModels } from "./data/openai"
import { ModelConfig } from "./types"

export const MODELS: ModelConfig[] = [...openaiModels, ...mistralModels]
