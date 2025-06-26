import { openproviders } from "@/lib/openproviders"
import { ModelConfig } from "../types"

// Interface for Ollama API response
interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: {
    parent_model?: string
    format?: string
    family?: string
    families?: string[]
    parameter_size?: string
    quantization_level?: string
  }
}

interface OllamaListResponse {
  models: OllamaModel[]
}

// Get Ollama base URL from environment or use default
const getOllamaBaseURL = (): string => {
  if (typeof window !== "undefined") {
    // Client-side: use localhost
    return "http://localhost:11434"
  }

  // Server-side: check environment variables
  return (
    process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "") || "http://localhost:11434"
  )
}

// Simple check: disabled in production or if DISABLE_OLLAMA=true
const shouldEnableOllama = (): boolean => {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DISABLE_OLLAMA !== "true"
  )
}

// Function to detect available Ollama models
async function detectOllamaModels(): Promise<ModelConfig[]> {
  if (!shouldEnableOllama()) {
    return []
  }

  try {
    const baseURL = getOllamaBaseURL()
    const response = await fetch(`${baseURL}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn(`Ollama not available at ${baseURL} or no models found`)
      return []
    }

    const data: OllamaListResponse = await response.json()

    return data.models.map((model): ModelConfig => {
      // Extract model family and size info
      const modelName = model.name
      const family = model.details.family || extractFamilyFromName(modelName)
      const parameterSize =
        model.details.parameter_size || extractSizeFromName(modelName)
      const sizeInGB = Math.round(model.size / (1024 * 1024 * 1024))

      // Determine provider based on model family
      const provider = getProviderFromFamily(family)

      // Generate tags based on model characteristics
      const tags = generateTags(modelName, family, parameterSize, sizeInGB)

      // Estimate context window based on model family
      const contextWindow = estimateContextWindow(family, modelName)

      return {
        id: modelName,
        name: formatModelName(modelName),
        provider: provider,
        providerId: "ollama",
        baseProviderId: "ollama",
        modelFamily: family,
        description: `${formatModelName(modelName)} running locally via Ollama (${sizeInGB}GB)`,
        tags: tags,
        contextWindow: contextWindow,
        inputCost: 0.0,
        outputCost: 0.0,
        priceUnit: "free (local)",
        vision: checkVisionCapability(modelName, family),
        tools: true, // Most modern models support tools
        audio: false, // Audio support is rare in local models
        reasoning: checkReasoningCapability(family),
        openSource: true, // All Ollama models are open source
        speed: estimateSpeed(parameterSize, sizeInGB),
        intelligence: estimateIntelligence(family, parameterSize),
        website: "https://ollama.com",
        apiDocs: "https://github.com/ollama/ollama/blob/main/docs/api.md",
        modelPage: `https://ollama.com/library/${modelName.split(":")[0]}`,
        apiSdk: (apiKey?: string) =>
          openproviders(modelName as string, undefined, apiKey),
      }
    })
  } catch (error) {
    console.warn("Failed to detect Ollama models:", error)
    return []
  }
}

// Helper functions
function extractFamilyFromName(modelName: string): string {
  const name = modelName.toLowerCase()
  if (name.includes("llama")) return "Llama"
  if (name.includes("qwen")) return "Qwen"
  if (name.includes("deepseek")) return "DeepSeek"
  if (name.includes("mistral")) return "Mistral"
  if (name.includes("codellama")) return "Code Llama"
  if (name.includes("phi")) return "Phi"
  if (name.includes("gemma")) return "Gemma"
  if (name.includes("codegemma")) return "CodeGemma"
  if (name.includes("starcoder")) return "StarCoder"
  if (name.includes("wizardcoder")) return "WizardCoder"
  if (name.includes("solar")) return "Solar"
  if (name.includes("yi")) return "Yi"
  if (name.includes("openchat")) return "OpenChat"
  if (name.includes("vicuna")) return "Vicuna"
  if (name.includes("orca")) return "Orca"
  return "Unknown"
}

function extractSizeFromName(modelName: string): string {
  const sizeMatch = modelName.match(/(\d+\.?\d*)[bB]/i)
  return sizeMatch ? `${sizeMatch[1]}B` : "Unknown"
}

function getProviderFromFamily(family: string): string {
  switch (family) {
    case "Llama":
    case "Code Llama":
      return "Meta"
    case "Qwen":
      return "Alibaba"
    case "DeepSeek":
      return "DeepSeek"
    case "Mistral":
      return "Mistral AI"
    case "Phi":
      return "Microsoft"
    case "Gemma":
    case "CodeGemma":
      return "Google"
    case "Yi":
      return "01.AI"
    default:
      return "Community"
  }
}

function generateTags(
  modelName: string,
  family: string,
  parameterSize: string,
  sizeInGB: number
): string[] {
  const tags = ["local", "open-source"]

  // Add size-based tags
  if (sizeInGB < 2) tags.push("lightweight")
  if (sizeInGB < 5) tags.push("fast")
  if (sizeInGB > 20) tags.push("large")

  // Add parameter size tag
  if (parameterSize !== "Unknown") tags.push(parameterSize.toLowerCase())

  // Add capability tags
  const name = modelName.toLowerCase()
  if (name.includes("code") || name.includes("coder")) tags.push("coding")
  if (name.includes("instruct") || name.includes("chat")) tags.push("chat")
  if (name.includes("vision") || name.includes("visual")) tags.push("vision")
  if (name.includes("math")) tags.push("math")

  return tags
}

function estimateContextWindow(family: string, modelName: string): number {
  const name = modelName.toLowerCase()

  // Check for explicit context window indicators
  if (name.includes("32k")) return 32768
  if (name.includes("128k")) return 131072
  if (name.includes("1m")) return 1048576

  // Family-based estimates
  switch (family) {
    case "Llama":
      return name.includes("3.2") || name.includes("3.1") ? 128000 : 4096
    case "Qwen":
      return 32768
    case "DeepSeek":
      return 163840
    case "Mistral":
      return 32768
    case "Phi":
      return 128000
    case "Gemma":
      return 8192
    default:
      return 4096
  }
}

function checkVisionCapability(modelName: string, family: string): boolean {
  const name = modelName.toLowerCase()
  return (
    name.includes("vision") ||
    name.includes("visual") ||
    (family === "Llama" && name.includes("3.2"))
  )
}

function checkReasoningCapability(family: string): boolean {
  // Most modern model families have reasoning capabilities
  return ["Llama", "Qwen", "DeepSeek", "Mistral", "Phi"].includes(family)
}

function estimateSpeed(
  parameterSize: string,
  sizeInGB: number
): "Fast" | "Medium" | "Slow" {
  if (sizeInGB < 5) return "Fast"
  if (sizeInGB < 15) return "Medium"
  return "Slow"
}

function estimateIntelligence(
  family: string,
  parameterSize: string
): "Low" | "Medium" | "High" {
  const sizeNum = parseFloat(parameterSize.replace(/[^0-9.]/g, ""))

  if (isNaN(sizeNum)) return "Medium"

  // Size-based intelligence estimation
  if (sizeNum < 3) return "Medium"
  if (sizeNum < 8) return "High"
  return "High"
}

function formatModelName(modelName: string): string {
  // Convert model name to a more readable format
  return modelName
    .split(":")[0] // Remove tag part
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Static fallback models for when Ollama is not available
const staticOllamaModels: ModelConfig[] = [
  {
    id: "llama3.2:latest",
    name: "Llama 3.2 Latest",
    provider: "Meta",
    providerId: "ollama",
    modelFamily: "Llama 3.2",
    baseProviderId: "meta",
    description: "Latest Llama 3.2 model running locally via Ollama",
    tags: ["local", "open-source", "fast", "8b"],
    contextWindow: 128000,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "free (local)",
    vision: false,
    tools: true,
    audio: false,
    reasoning: true,
    openSource: true,
    speed: "Fast",
    intelligence: "High",
    website: "https://ollama.com",
    apiDocs: "https://github.com/ollama/ollama/blob/main/docs/api.md",
    modelPage: "https://ollama.com/library/llama3.2",
    apiSdk: (apiKey?: string) =>
      openproviders("llama3.2:latest" as string, undefined, apiKey),
  },
  {
    id: "qwen2.5-coder:latest",
    name: "Qwen 2.5 Coder",
    provider: "Alibaba",
    providerId: "ollama",
    modelFamily: "Qwen 2.5",
    baseProviderId: "alibaba",
    description:
      "Specialized coding model based on Qwen 2.5, optimized for programming tasks",
    tags: ["local", "open-source", "coding", "7b"],
    contextWindow: 32768,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "free (local)",
    vision: false,
    tools: true,
    audio: false,
    reasoning: true,
    openSource: true,
    speed: "Fast",
    intelligence: "High",
    website: "https://ollama.com",
    apiDocs: "https://github.com/ollama/ollama/blob/main/docs/api.md",
    modelPage: "https://ollama.com/library/qwen2.5-coder",
    apiSdk: (apiKey?: string) =>
      openproviders("qwen2.5-coder:latest" as string, undefined, apiKey),
  },
]

// Export function to get Ollama models
export async function getOllamaModels(): Promise<ModelConfig[]> {
  const detectedModels = await detectOllamaModels()

  // If no models detected and Ollama is enabled, return static fallback models
  if (detectedModels.length === 0 && shouldEnableOllama()) {
    console.info("Using static Ollama models as fallback")
    return staticOllamaModels
  }

  if (detectedModels.length > 0) {
    console.info(`Detected ${detectedModels.length} Ollama models`)
  }

  return detectedModels
}

// For backward compatibility, export static models
export const ollamaModels = staticOllamaModels
