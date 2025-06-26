import { LayoutApp } from "@/app/components/layout/layout-app"
import { MultiChat } from "@/app/multi/multi-chat"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default function MultiChatPage() {
  return notFound()

  return (
    <MessagesProvider>
      <LayoutApp>
        <MultiChat />
      </LayoutApp>
    </MessagesProvider>
  )
}
