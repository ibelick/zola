import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Chat from "../../components/chat/chat"
import LayoutApp from "../../components/layout/layout-app"

export default async function ChatPage() {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    redirect("/")
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <Chat />
      </LayoutApp>
    </MessagesProvider>
  )
}
