import { cn } from "@/lib/utils"
import Link from "next/link"
import { SidebarItemMenu } from "./sidebar-item-menu"

type SidebarItemProps = {
  chat: any
  currentChatId: string
}

export function SidebarItem({ chat, currentChatId }: SidebarItemProps) {
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
          className="text-primary relative line-clamp-1 mask-r-from-80% mask-r-to-85% px-2 py-2 text-sm text-ellipsis whitespace-nowrap"
          title={chat.title || "Untitled Chat"}
        >
          {chat.title || "Untitled Chat"}
        </div>
      </Link>

      <div
        className="absolute top-0 right-1 flex h-full items-center justify-center opacity-0 transition-opacity group-hover/chat:opacity-100"
        key={chat.id}
      >
        <SidebarItemMenu chat={chat} />
      </div>
    </div>
  )
}
