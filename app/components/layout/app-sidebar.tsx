"use client"

import { groupChatsByDate } from "@/app/components/history/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useChats } from "@/lib/chat-store/chats/provider"
import { cn } from "@/lib/utils"
import { GithubLogo } from "@phosphor-icons/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"

export function AppSidebar() {
  const { chats } = useChats()
  const params = useParams<{ chatId: string }>()
  const currentChatId = params.chatId

  // Group chats by time periods - memoized to avoid recalculation
  const groupedChats = useMemo(() => groupChatsByDate(chats, ""), [chats])

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="border-none">
      <SidebarHeader className="h-14 pl-3"></SidebarHeader>
      <SidebarContent className="mask-t-from-98% mask-t-to-100% mask-b-from-98% mask-b-to-100% px-3 pt-0 pb-4">
        <div className="space-y-5">
          {groupedChats?.map((group) => (
            <SidebarSection
              key={group.name}
              title={group.name}
              items={group.chats}
              currentChatId={currentChatId}
            />
          ))}

          {!groupedChats?.length && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              No chat history found.
            </div>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter className="mb-2 p-3">
        <a
          href="https://github.com/ibelick/zola"
          className="hover:bg-muted flex items-center gap-2 rounded-md p-2"
          target="_blank"
          aria-label="Star the repo on GitHub"
        >
          <div className="rounded-full border p-1">
            <GithubLogo className="size-4" />
          </div>
          <div className="flex flex-col">
            <div className="text-sidebar-foreground text-sm font-medium">
              Zola is open source
            </div>
            <div className="text-sidebar-foreground/70 text-xs">
              Star the repo on GitHub!
            </div>
          </div>
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}

const SidebarSection = ({
  title,
  items,
  currentChatId,
}: {
  title: string
  items: any[]
  currentChatId: string
}) => {
  return (
    <div>
      <h3 className="overflow-hidden px-2 pt-3 pb-2 text-xs font-semibold break-all text-ellipsis">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((chat) => (
          <Link
            key={chat.id}
            href={`/c/${chat.id}`}
            className={cn(
              "hover:bg-muted hover:text-foreground relative block w-full rounded-md transition-colors",
              chat.id === currentChatId && "bg-accent text-foreground"
            )}
            prefetch
          >
            <div
              className="text-primary relative line-clamp-1 mask-r-from-85% mask-r-to-90% px-2 py-2 text-sm text-ellipsis whitespace-nowrap"
              title={chat.title || "Untitled Chat"}
            >
              {chat.title || "Untitled Chat"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
