"use client"

import { AppSidebar } from "@/app/components/layout/app-sidebar"
import { Header } from "@/app/components/layout/header"
import { useLayout } from "@/app/hooks/use-layout"

export function LayoutApp({ children }: { children: React.ReactNode }) {
  const { layout: selectedLayout } = useLayout()

  const hasSidebar = selectedLayout === "sidebar"

  return (
    <div className="bg-background flex h-screen w-full overflow-hidden">
      {hasSidebar && <AppSidebar />}
      <main className="@container relative h-dvh w-0 flex-shrink flex-grow overflow-y-auto">
        <Header hasSidebar={hasSidebar} />
        {children}
      </main>
    </div>
  )
}
