import type { Provider, SupportedModel } from "./types"

// map each model ID to its provider
const MODEL_PROVIDER_MAP: Record<string, Provider> = {
  "nusantara-base": "neosantara",
  "archipelago-7b": "neosantara",

  // Mistral
  "ministral-3b-latest": "mistral",
  "ministral-8b-latest": "mistral",
  "mistral-large-latest": "mistral",
  "mistral-small-latest": "mistral",
  "pixtral-large-latest": "mistral",
  "pixtral-12b-2409": "mistral",
  "open-mistral-7b": "mistral",
  "open-mixtral-8x7b": "mistral",
  "open-mixtral-8x22b": "mistral",

  //Perplexity
  "sonar":"perplexity",
  "sonar-pro": "perplexity",
  "sonar-deep-research": "perplexity",
  "sonar-reasoning-pro": "perplexity",
  "sonar-reasoning": "perplexity",

  // Google
  "gemini-2.0-flash-001": "google",
  "gemini-1.5-flash": "google",
  "gemini-1.5-flash-latest": "google",
  "gemini-1.5-flash-001": "google",
  "gemini-1.5-flash-002": "google",
  "gemini-1.5-flash-8b": "google",
  "gemini-1.5-flash-8b-latest": "google",
  "gemini-1.5-flash-8b-001": "google",
  "gemini-1.5-pro": "google",
  "gemini-1.5-pro-latest": "google",
  "gemini-1.5-pro-001": "google",
  "gemini-1.5-pro-002": "google",
  "gemini-2.5-pro-exp-03-25": "google",
  "gemini-2.0-flash-lite-preview-02-05": "google",
  "gemini-2.0-pro-exp-02-05": "google",
  "gemini-2.0-flash-thinking-exp-01-21": "google",
  "gemini-2.0-flash-exp": "google",
  "gemini-exp-1206": "google",
  "gemma-3-27b-it": "google",
  "learnlm-1.5-pro-experimental": "google",

  // Anthropic
  "claude-3-7-sonnet-20250219": "anthropic",
  "claude-3-5-sonnet-latest": "anthropic",
  "claude-3-5-sonnet-20241022": "anthropic",
  "claude-3-5-sonnet-20240620": "anthropic",
  "claude-3-5-haiku-latest": "anthropic",
  "claude-3-5-haiku-20241022": "anthropic",
  "claude-3-opus-latest": "anthropic",
  "claude-3-opus-20240229": "anthropic",
  "claude-3-sonnet-20240229": "anthropic",
  "claude-3-haiku-20240307": "anthropic",

  // XAI
  "grok-3": "xai",
  "grok-3-latest": "xai",
  "grok-3-fast": "xai",
  "grok-3-fast-latest": "xai",
  "grok-3-mini": "xai",
  "grok-3-mini-latest": "xai",
  "grok-3-mini-fast": "xai",
  "grok-3-mini-fast-latest": "xai",
  "grok-2-vision-1212": "xai",
  "grok-2-vision": "xai",
  "grok-2-vision-latest": "xai",
  "grok-2-image-1212": "xai",
  "grok-2-image": "xai",
  "grok-2-image-latest": "xai",
  "grok-2-1212": "xai",
  "grok-2": "xai",
  "grok-2-latest": "xai",
  "grok-vision-beta": "xai",
  "grok-beta": "xai",

  // Static Ollama models
  "llama3.2:latest": "ollama",
  "qwen2.5-coder:latest": "ollama",
}

// Function to check if a model is likely an Ollama model based on naming patterns
function isOllamaModel(modelId: string): boolean {
  // Common Ollama model patterns
  const ollamaPatterns = [
    /^llama/i,
    /^qwen/i,
    /^deepseek/i,
    /^mistral:/i,
    /^codellama/i,
    /^phi/i,
    /^gemma/i,
    /^codegemma/i,
    /^starcoder/i,
    /^wizardcoder/i,
    /^solar/i,
    /^yi/i,
    /^openchat/i,
    /^vicuna/i,
    /^orca/i,
    /:latest$/i,
    /:[\d.]+[bB]?$/i, // version tags like :7b, :13b, :1.5
  ]

  return ollamaPatterns.some((pattern) => pattern.test(modelId))
}

export function getProviderForModel(model: SupportedModel): Provider {
  if (model.startsWith("openrouter:")) {
    return "openrouter"
  }

  // First check the static mapping
  const provider = MODEL_PROVIDER_MAP[model]
  if (provider) return provider

  // If not found in static mapping, check if it looks like an Ollama model
  if (isOllamaModel(model)) {
    return "ollama"
  }

  throw new Error(`Unknown provider for model: ${model}`)
}
