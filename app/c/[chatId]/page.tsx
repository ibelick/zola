import { ChatContainer } from "@/app/components/chat/chat-container"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { getMessagesFromDb } from "@/lib/chat-store/messages/api"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { Message as MessageAISDK } from "ai"
import { redirect } from "next/navigation"

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  let initialMessages: MessageAISDK[] = []
  const { chatId } = await params
  if (isSupabaseEnabled) {
    const supabase = await createClient()
    if (supabase) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        redirect("/")
      }
      initialMessages = await getMessagesFromDb(chatId)
    }
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <ChatContainer autoResume={true} initialMessages={initialMessages} />
      </LayoutApp>
    </MessagesProvider>
  )
}
