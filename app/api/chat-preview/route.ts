import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Simple UUID validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    // Enhanced validation
    if (!chatId) {
      return NextResponse.json(
        { success: false, error: "Chat ID is required" },
        { status: 400 }
      )
    }

    if (!isValidUUID(chatId)) {
      return NextResponse.json(
        { success: false, error: "Invalid chat ID format" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 }
      )
    }

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // First verify the chat belongs to the user
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, user_id, created_at")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError) {
      if (chatError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: "Chat not found" },
          { status: 404 }
        )
      }
      console.error("Chat fetch error:", chatError)
      return NextResponse.json(
        { success: false, error: "Failed to verify chat access" },
        { status: 500 }
      )
    }

    if (!chat) {
      return NextResponse.json(
        { success: false, error: "Chat not found or access denied" },
        { status: 404 }
      )
    }

    // Fetch the last 5 messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, content, role, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (messagesError) {
      console.error("Messages fetch error:", messagesError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch messages" },
        { status: 500 }
      )
    }

    // Reverse the messages to show them in chronological order (oldest first)
    const orderedMessages = messages?.reverse() || []

    // Create response with cache headers
    const response = NextResponse.json({
      success: true,
      messages: orderedMessages,
      chatId,
      count: orderedMessages.length,
    })

    // Add cache headers (30 seconds cache, allows revalidation)
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    response.headers.set('ETag', `"${chatId}-${chat.created_at}"`)
    
    return response

  } catch (error) {
    console.error("Chat preview API error:", error)
    
    // Don't expose internal error details to client
    const errorMessage = error instanceof Error && error.message.includes('fetch')
      ? "Network error occurred"
      : "Internal server error"
      
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
} 