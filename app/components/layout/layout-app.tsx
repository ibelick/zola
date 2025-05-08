"use client"

import { AppSidebar } from "@/app/components/layout/app-sidebar"
import { Header } from "@/app/components/layout/header"
import { HeaderSidebarTrigger } from "@/app/components/layout/header-sidebar-trigger"
import { SidebarProvider } from "@/components/ui/sidebar"

// You can change this to control whether the sidebar is shown by default
const hasSidebar = true

export function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="bg-background flex h-screen w-full overflow-hidden">
        {hasSidebar && <AppSidebar />}
        <main className="@container relative h-dvh w-0 flex-shrink flex-grow">
          <Header hasSidebar={hasSidebar} />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
