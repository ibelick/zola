"use client"

import { HeaderGoBack } from "@/app/components/header-go-back"

export default function DashboardPage() {
  return (
    <div className="relative flex h-full flex-col items-center">
      <HeaderGoBack />
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Coming soon!</p>
      </div>
    </div>
  )
}
