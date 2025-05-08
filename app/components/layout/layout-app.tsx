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
        <div className="flex flex-1 flex-col">
          <div className="flex items-center">
            {hasSidebar && <HeaderSidebarTrigger className="mr-2" />}
            <Header />
          </div>
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
