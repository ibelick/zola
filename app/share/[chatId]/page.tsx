import { APP_DOMAIN } from "@/lib/config"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Article from "./article"

export const dynamic = "force-static"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chatId: string }>
}): Promise<Metadata> {
  if (!isSupabaseEnabled) {
    return notFound()
  }

  const { chatId } = await params
  const supabase = await createClient()

  if (!supabase) {
    return notFound()
  }

  const { data: chat } = await supabase
    .from("chats")
    .select("title, created_at")
    .eq("id", chatId)
    .single()

  const title = chat?.title || "Chat"
  const description = "A chat in Zola"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${APP_DOMAIN}/share/${chatId}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function ShareChat({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  if (!isSupabaseEnabled) {
    return notFound()
  }

  const { chatId } = await params
  const supabase = await createClient()

  if (!supabase) {
    return notFound()
  }

  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select("id, title, created_at")
    .eq("id", chatId)
    .single()

  if (chatError || !chatData) {
    redirect("/")
  }

  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (messagesError || !messagesData) {
    redirect("/")
  }

  return (
    <Article
      messages={messagesData}
      date={chatData.created_at || ""}
      title={chatData.title || ""}
      subtitle={"A conversation in Zola"}
    />
  )
}
