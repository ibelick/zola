import {
  AUTH_DAILY_MESSAGE_LIMIT,
  NON_AUTH_DAILY_MESSAGE_LIMIT,
} from "@/lib/config"
import { validateUserIdentity } from "../../../lib/server/api"


export async function GET(req: Request) {
  
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const isAuthenticated = searchParams.get("isAuthenticated") === "true"
    
    if (!userId) {
      return new Response(JSON.stringify({error: "Missing userId"}), {
        status: 400,
      })
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    const { data, error } = await supabase
      .from("users")
      .select("daily_message_count")
      .eq("id", userId)
      .maybeSingle()

    if (error || !data){
      return new Response(JSON.stringify({ error: error?.message }), {
        status: 500,
      })
    }

    const dailyLimit = isAuthenticated
      ? AUTH_DAILY_MESSAGE_LIMIT
      : NON_AUTH_DAILY_MESSAGE_LIMIT
    const dailyCount = data.daily_message_count || 0
    const remaining = dailyLimit - dailyCount

    return new Response(JSON.stringify({ dailyCount, dailyLimit, remaining }), {
      status: 200,
    })
  } 
  

