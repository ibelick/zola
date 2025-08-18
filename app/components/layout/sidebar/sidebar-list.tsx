import { Chat } from "@/lib/chat-store/types"
import { ReactNode } from "react"
import { SidebarItem } from "./sidebar-item"

type SidebarListProps = {
  title: string
  icon?: ReactNode
  items: Chat[]
  currentChatId: string
}

export function SidebarList({
  title,
  icon,
  items,
  currentChatId,
}: SidebarListProps) {
  return (
    <div>
      <h3 className="flex items-center gap-1 overflow-hidden px-2 pt-3 pb-2 text-xs font-semibold break-all text-ellipsis">
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((chat) => (
          <SidebarItem
            key={chat.id}
            chat={chat}
            currentChatId={currentChatId}
          />
        ))}
      </div>
    </div>
  )
}
