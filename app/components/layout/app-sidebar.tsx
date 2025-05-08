"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { GithubLogo } from "@phosphor-icons/react"
import Link from "next/link"
import { useId } from "react"

// Mock data for sidebar items
const todayItems = [
  "PC and Software History",
  "zola.chat product design",
  "social media",
  "AI Demo Ideas",
  "Muscle Gain and Endurance",
  "full vision",
]

const yesterdayItems = [
  "zola.chat vision + strategy",
  "code fix",
  "Zola research archive",
]

const previousWeekItems = [
  "Zola Agent Setup",
  "AI App Naming Ideas",
  "Zola talk to users",
  "Climats de Bourgogne expliqué",
  "Ultra Shoe Recommendations",
]

const lastMonthItems = [
  "Zola Agent Setup",
  "AI App Naming Ideas",
  "Zola talk to users",
  "Climats de Bourgogne expliqué",
  "Ultra Shoe Recommendations",
  "Zola Agent Setup",
  "AI App Naming Ideas",
  "Zola talk to users",
  "Climats de Bourgogne expliqué",
  "Ultra Shoe Recommendations",
]

const SidebarSection = ({
  title,
  items,
}: {
  title: string
  items: string[]
}) => {
  const uniqueId = useId()

  return (
    <div>
      <h3 className="overflow-hidden px-2 pt-3 pb-2 text-xs font-semibold break-all text-ellipsis">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((item, index) => (
          <Link
            key={`${uniqueId}-${item}-${index}`}
            href="#"
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground block w-full rounded-md p-2 text-sm transition-colors",
              title === "Today" && index === 0 && "bg-accent text-foreground"
            )}
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="border-none">
      <SidebarHeader className="h-14 pl-3"></SidebarHeader>
      <SidebarContent className="px-3 pt-0 pb-4">
        <div className="space-y-5">
          <SidebarSection title="Today" items={todayItems} />
          <SidebarSection title="Yesterday" items={yesterdayItems} />
          <SidebarSection title="Previous 7 Days" items={previousWeekItems} />
          <SidebarSection title="Last Month" items={lastMonthItems} />
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
