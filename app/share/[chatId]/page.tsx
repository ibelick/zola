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
  params: Promise<{ agentSlug?: string; chatId: string }>
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

export default async function AgentChat({
  params,
}: {
  params: Promise<{ agentSlug?: string; chatId: string }>
}) {
  if (!isSupabaseEnabled) {
    return notFound()
  }

  const { agentSlug, chatId } = await params
  const supabase = await createClient()

  if (!supabase) {
    return notFound()
  }

  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select("id, title, agent_id, created_at")
    .eq("id", chatId)
    .single()

  if (chatError || !chatData) {
    redirect("/agents")
  }

  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })

  if (messagesError || !messagesData) {
    redirect("/agents")
  }

  let agentData = null

  if (agentSlug) {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("slug", agentSlug)
      .single()

    if (!error) {
      agentData = data
    }
  }

  return (
    <Article
      messages={messagesData}
      date={chatData.created_at || ""}
      agentSlug={agentSlug || ""}
      agentName={agentData?.name || ""}
      title={chatData.title || ""}
      subtitle={
        agentData
          ? `A conversation with ${agentData.name}, an AI agent built in Zola`
          : "A conversation in Zola"
      }
    />
  )
}
