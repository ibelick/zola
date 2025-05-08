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
      <h3 className="mb-3 px-1 text-base font-semibold">{title}</h3>
      <div className="space-y-1">
        {items.map((item, index) => (
          <Link
            key={item}
            href="#"
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground block w-full rounded-md px-3 py-2 text-sm transition-colors",
              title === "Today" &&
                index === 0 &&
                "bg-muted text-foreground font-medium"
            )}
          >
            {item}
          </Link>
        ))}
      </div>
    </div>
  )

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      className="w-64 border-r-0"
    >
      <SidebarHeader className="border-sidebar-border h-14 border-b p-4">
        <div className="flex items-center justify-between">
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="24" height="24" rx="4" fill="#f5f5f5" />
            <path
              d="M12 6v12M6 12h12"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <div className="space-y-7">
          <SidebarSection title="Today" items={todayItems} />
          <SidebarSection title="Yesterday" items={yesterdayItems} />
          <SidebarSection title="Previous 7 Days" items={previousWeekItems} />
        </div>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-sidebar-border border-t p-4">
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
