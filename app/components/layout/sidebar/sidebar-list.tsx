import { Chat } from "@/lib/chat-store/types"
import { SidebarItem } from "./sidebar-item"
import { motion } from "motion/react"

type SidebarListProps = {
  title: string
  items: Chat[]
  currentChatId: string
}

export function SidebarList({ title, items, currentChatId }: SidebarListProps) {
  return (
    <div>
      <h3 className="overflow-hidden px-2 pt-3 pb-2 text-xs font-semibold break-all text-ellipsis">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((chat, index) => {
          // Animation variants for blur fade-in climbing effect
          const itemVariants = {
            hidden: {
              opacity: 0,
              filter: "blur(8px)",
              y: 15,
              scale: 0.98
            },
            visible: {
              opacity: 1,
              filter: "blur(0px)",
              y: 0,
              scale: 1,
              transition: {
                duration: 0.4,
                delay: index * 0.08, // Staggered climbing effect
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth feel
              }
            }
          }

          return (
            <motion.div
              key={chat.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <SidebarItem
                chat={chat}
                currentChatId={currentChatId}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
