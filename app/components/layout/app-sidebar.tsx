"use client"

import { groupChatsByDate } from "@/app/components/history/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useChats } from "@/lib/chat-store/chats/provider"
import { cn } from "@/lib/utils"
import {
  DotsThree,
  GithubLogo,
  MagnifyingGlass,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { HistoryTrigger } from "../history/history-trigger"

export function AppSidebar() {
  const { open } = useSidebar()
  const { chats } = useChats()
  const params = useParams<{ chatId: string }>()
  const currentChatId = params.chatId

  // Group chats by time periods - memoized to avoid recalculation
  const groupedChats = useMemo(() => groupChatsByDate(chats, ""), [chats])

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="border-none">
      <SidebarHeader className="h-14 pl-3">
        <div className="flex justify-between">
          <div className="bg-sidebar flex-1" />
          <AnimatePresence mode="sync">
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.15, delay: 0.1, ease: "easeOut" }}
                className="pt-0"
              >
                <HistoryTrigger
                  hasSidebar={false}
                  classNameTrigger="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none bg-transparent"
                  icon={<MagnifyingGlass size={24} />}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarHeader>
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

function LinkChatMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hover:bg-secondary flex size-7 items-center justify-center rounded-md p-1 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThree size={18} className="text-primary" weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="cursor-pointer">
          <PencilSimple size={16} className="mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive cursor-pointer"
          variant="destructive"
        >
          <Trash size={16} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LinkChat({
  chat,
  currentChatId,
}: {
  chat: any
  currentChatId: string
}) {
  return (
    <div
      className={cn(
        "hover:bg-accent/80 hover:text-foreground group/chat relative w-full rounded-md transition-colors",
        chat.id === currentChatId && "bg-accent hover:bg-accent text-foreground"
      )}
    >
      <Link
        href={`/c/${chat.id}`}
        className="block w-full"
        prefetch
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="text-primary relative line-clamp-1 mask-r-from-85% mask-r-to-90% px-2 py-2 text-sm text-ellipsis whitespace-nowrap"
          title={chat.title || "Untitled Chat"}
        >
          {chat.title || "Untitled Chat"}
        </div>
      </Link>

      <div
        className="absolute top-0 right-1 flex h-full items-center justify-center opacity-0 transition-opacity group-hover/chat:opacity-100"
        key={chat.id}
      >
        <LinkChatMenu />
      </div>
    </div>
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
          <LinkChat key={chat.id} chat={chat} currentChatId={currentChatId} />
        ))}
      </div>
    </div>
  )
}
