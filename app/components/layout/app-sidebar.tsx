"use client"

import { useUser } from "@/app/providers/user-provider"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { SignOut } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  const SidebarSection = ({
    title,
    items,
  }: {
    title: string
    items: string[]
  }) => (
    <div>
      <h3 className="overflow-hidden px-2 pt-3 pb-2 text-xs font-semibold break-all text-ellipsis">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((item, index) => (
          <Link
            key={item}
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

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" className="border-none">
      <SidebarHeader className="h-14 pl-3"></SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <div className="space-y-5">
          <SidebarSection title="Today" items={todayItems} />
          <SidebarSection title="Yesterday" items={yesterdayItems} />
          <SidebarSection title="Previous 7 Days" items={previousWeekItems} />
        </div>
      </SidebarContent>

      {user && (
        <SidebarFooter className="p-4">
          <div className="flex flex-col">
            <div className="text-sidebar-foreground text-sm font-medium">
              {user.display_name}
            </div>
            <div className="text-sidebar-foreground/70 text-xs">
              {user.email}
            </div>
            <SidebarSeparator className="my-2" />
            <Button variant="ghost" size="sm" className="justify-start">
              <Link href="/auth/logout" className="flex items-center">
                <SignOut className="mr-2 size-4" />
                Sign out
              </Link>
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
