import { APP_DOMAIN } from "@/lib/config"
import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Article from "./article"

export const dynamic = "force-static"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string; chatId: string }>
}): Promise<Metadata> {
  const { agentSlug, chatId } = await params
  const supabase = await createClient()

  const { data: chat } = await supabase
    .from("chats")
    .select("title, system_prompt")
    .eq("id", chatId)
    .single()

  const { data: agent } = await supabase
    .from("agents")
    .select("name")
    .eq("slug", agentSlug)
    .single()

  const title = chat?.title || `Public Zola research`
  const description =
    chat?.system_prompt || `A research powered by ${agent?.name}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${APP_DOMAIN}/agents/${agentSlug}/${chatId}`,
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
  params: Promise<{ agentSlug: string; chatId: string }>
}) {
  const { agentSlug, chatId } = await params
  const supabase = await createClient()

  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select("id, title, model, system_prompt, agent_id, created_at")
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

  const { data: agentData, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", agentSlug)
    .single()

  if (agentError || !agentData) {
    redirect("/agents")
  }

  return (
    <Article
      messages={messagesData}
      date={chatData.created_at || ""}
      category={agentData.name}
      title={chatData.title || ""}
      subtitle={`A conversation with ${agentData.name}, an AI agent built in Zola`}
      cta={{
        text: "Read more",
        href: "/agents",
      }}
    />
  )
}
