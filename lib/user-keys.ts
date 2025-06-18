import { decryptKey } from "./encryption"
import { env } from "./openproviders/env"
import { Provider } from "./openproviders/types"
import { createClient } from "./supabase/server"

export type { Provider } from "./openproviders/types"
export type ProviderWithoutOllama = Exclude<Provider, "ollama">

export async function getUserKey(
  userId: string,
  provider: Provider
): Promise<string | null> {
  try {
    const supabase = await createClient()
    if (!supabase) return null

    const { data, error } = await supabase
      .from("user_keys")
      .select("encrypted_key, iv")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single()

    if (error || !data) return null

    return decryptKey(data.encrypted_key, data.iv)
  } catch (error) {
    console.error("Error retrieving user key:", error)
    return null
  }
}

export async function getEffectiveApiKey(
  userId: string | null,
  provider: ProviderWithoutOllama
): Promise<string | null> {
  if (userId) {
    const userKey = await getUserKey(userId, provider)
    if (userKey) return userKey
  }

  const envKeyMap: Record<ProviderWithoutOllama, string | undefined> = {
    openai: env.OPENAI_API_KEY,
    mistral: env.MISTRAL_API_KEY,
    perplexity: env.PERPLEXITY_API_KEY,
    google: env.GOOGLE_GENERATIVE_AI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
    xai: env.XAI_API_KEY,
    openrouter: env.OPENROUTER_API_KEY,
  }

  return envKeyMap[provider] || null
}
