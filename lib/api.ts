import { UserProfile } from "@/app/types/user"
import { APP_DOMAIN, DAILY_SPECIAL_AGENT_LIMIT } from "@/lib/config"
import { SupabaseClient } from "@supabase/supabase-js"
import { fetchClient } from "./fetch"
import {
  API_ROUTE_CREATE_GUEST,
  API_ROUTE_UPDATE_CHAT_AGENT,
  API_ROUTE_UPDATE_CHAT_MODEL,
} from "./routes"
import { createClient } from "./supabase/client"

/**
 * Creates a guest user record on the server
 */
export async function createGuestUser(guestId: string) {
  try {
    const res = await fetchClient(API_ROUTE_CREATE_GUEST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: guestId }),
    })
    const responseData = await res.json()
    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to create guest user: ${res.status} ${res.statusText}`
      )
    }

    return responseData
  } catch (err) {
    console.error("Error creating guest user:", err)
    throw err
  }
}

export class UsageLimitError extends Error {
  code: string
  constructor(message: string) {
    super(message)
    this.code = "DAILY_LIMIT_REACHED"
  }
}

/**
 * Checks the user's daily usage and increments both overall and daily counters.
 * Resets the daily counter if a new day (UTC) is detected.
 * Uses the `anonymous` flag from the user record to decide which daily limit applies.
 *
 * @param supabase - Your Supabase client.
 * @param userId - The ID of the user.
 * @returns The remaining daily limit.
 */
export async function checkRateLimits(
  userId: string,
  isAuthenticated: boolean
) {
  try {
    const res = await fetchClient(
      `/api/rate-limits?userId=${userId}&isAuthenticated=${isAuthenticated}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    const responseData = await res.json()
    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to check rate limits: ${res.status} ${res.statusText}`
      )
    }
    return responseData
  } catch (err) {
    console.error("Error checking rate limits:", err)
    throw err
  }
}

/**
 * Updates the model for an existing chat
 */
export async function updateChatModel(chatId: string, model: string) {
  try {
    const res = await fetchClient(API_ROUTE_UPDATE_CHAT_MODEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, model }),
    })
    const responseData = await res.json()

    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update chat model: ${res.status} ${res.statusText}`
      )
    }

    return responseData
  } catch (error) {
    console.error("Error updating chat model:", error)
    throw error
  }
}

/**
 * Signs in user with Google OAuth via Supabase
 */
export async function signInWithGoogle(supabase: SupabaseClient) {
  try {
    const isDev = process.env.NODE_ENV === "development"

    // Get base URL dynamically (will work in both browser and server environments)
    let baseUrl = isDev
      ? "http://localhost:3000"
      : typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : APP_DOMAIN

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      throw error
    }

    // Return the provider URL
    return data
  } catch (err) {
    console.error("Error signing in with Google:", err)
    throw err
  }
}

export const getOrCreateGuestUserId = async (
  user: UserProfile | null
): Promise<string | null> => {
  if (user?.id) return user.id

  const supabase = createClient()

  const existingGuestSessionUser = await supabase.auth.getUser()
  if (
    existingGuestSessionUser.data?.user &&
    existingGuestSessionUser.data.user.is_anonymous
  ) {
    const anonUserId = existingGuestSessionUser.data.user.id

    const profileCreationAttempted = localStorage.getItem(
      `guestProfileAttempted_${anonUserId}`
    )

    if (!profileCreationAttempted) {
      try {
        await createGuestUser(anonUserId)
        localStorage.setItem(`guestProfileAttempted_${anonUserId}`, "true")
      } catch (error) {
        console.error(
          "Failed to ensure guest user profile exists for existing anonymous auth user:",
          error
        )
        return null
      }
    }
    return anonUserId
  }

  try {
    const { data: anonAuthData, error: anonAuthError } =
      await supabase.auth.signInAnonymously()

    if (anonAuthError) {
      console.error("Error during anonymous sign-in:", anonAuthError)
      return null
    }

    if (!anonAuthData || !anonAuthData.user) {
      console.error("Anonymous sign-in did not return a user.")
      return null
    }

    const guestIdFromAuth = anonAuthData.user.id
    await createGuestUser(guestIdFromAuth)
    localStorage.setItem(`guestProfileAttempted_${guestIdFromAuth}`, "true")
    return guestIdFromAuth
  } catch (error) {
    console.error(
      "Error in getOrCreateGuestUserId during anonymous sign-in or profile creation:",
      error
    )
    return null
  }
}

export class SpecialAgentLimitError extends Error {
  code: string
  constructor(message: string = "Special agent usage limit reached.") {
    super(message)
    this.code = "SPECIAL_AGENT_LIMIT_REACHED"
  }
}

export async function checkSpecialAgentUsage(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: user, error } = await supabase
    .from("users")
    .select("special_agent_count, special_agent_reset, premium")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to fetch user data: " + error.message)
  }
  if (!user) {
    throw new Error("User not found")
  }

  const now = new Date()
  const lastReset = user.special_agent_reset
    ? new Date(user.special_agent_reset)
    : null
  let usageCount = user.special_agent_count || 0

  const isNewDay =
    !lastReset ||
    now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
    now.getUTCMonth() !== lastReset.getUTCMonth() ||
    now.getUTCDate() !== lastReset.getUTCDate()

  if (isNewDay) {
    usageCount = 0
    const { error: resetError } = await supabase
      .from("users")
      .update({
        special_agent_count: 0,
        special_agent_reset: now.toISOString(),
      })
      .eq("id", userId)
    if (resetError) {
      throw new Error(
        "Failed to reset special agent count: " + resetError.message
      )
    }
  }

  if (usageCount >= DAILY_SPECIAL_AGENT_LIMIT) {
    const err = new SpecialAgentLimitError()
    throw err
  }

  return {
    usageCount,
    limit: DAILY_SPECIAL_AGENT_LIMIT,
  }
}

export async function incrementSpecialAgentUsage(
  supabase: SupabaseClient,
  userId: string,
  currentCount?: number
): Promise<void> {
  let specialAgentCount: number

  if (typeof currentCount === "number") {
    specialAgentCount = currentCount
  } else {
    const { data, error } = await supabase
      .from("users")
      .select("special_agent_count")
      .eq("id", userId)
      .maybeSingle()

    if (error || !data) {
      throw new Error(
        "Failed to fetch special agent count: " +
          (error?.message || "Not found")
      )
    }

    specialAgentCount = data.special_agent_count || 0
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      special_agent_count: specialAgentCount + 1,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) {
    throw new Error(
      "Failed to increment special agent count: " + updateError.message
    )
  }
}

/**
 * Updates the agent for an existing chat
 */
export async function updateChatAgent(
  userId: string,
  chatId: string,
  agentId: string | null,
  isAuthenticated: boolean
) {
  try {
    const res = await fetchClient(API_ROUTE_UPDATE_CHAT_AGENT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, chatId, agentId, isAuthenticated }),
    })
    const responseData = await res.json()

    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update chat agent: ${res.status} ${res.statusText}`
      )
    }

    return responseData
  } catch (error) {
    console.error("Error updating chat agent:", error)
    throw error
  }
}
