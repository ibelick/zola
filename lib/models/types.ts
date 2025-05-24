type ModelConfig = {
  id: string // "gpt-4-1-nano"
  name: string // "GPT-4.1 Nano"
  provider: string // "OpenAI", "Mistral", etc.
  modelFamily?: string // "GPT-4", "Claude 3", etc.

  description?: string // Short 1–2 line summary
  tags?: string[] // ["fast", "cheap", "vision", "OSS"]

  contextWindow?: number // in tokens
  inputCost?: number // USD per 1M input tokens
  outputCost?: number // USD per 1M output tokens
  priceUnit?: string // "per 1M tokens", "per image", etc.

  vision?: boolean
  tools?: boolean
  audio?: boolean
  openSource?: boolean

  latency?: "Fast" | "Medium" | "Slow"

  website?: string // official website (e.g. https://openai.com)
  apiDocs?: string // official API docs (e.g. https://platform.openai.com/docs/api-reference)
  modelPage?: string // official product page (e.g. https://x.ai/news/grok-2)
  releasedAt?: string // "2024-12-01" (optional, for tracking changes)
}
