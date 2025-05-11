"use client"

import { groupChatsByDate } from "@/app/components/history/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useChats } from "@/lib/chat-store/chats/provider"
import { GithubLogo, MagnifyingGlass } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { HistoryTrigger } from "../../history/history-trigger"
import { SidebarList } from "./sidebar-list"

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
            <SidebarList
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
