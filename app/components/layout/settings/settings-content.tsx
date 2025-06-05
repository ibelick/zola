"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { cn, isDev } from "@/lib/utils"
import {
  GearSixIcon,
  KeyIcon,
  PaintBrushIcon,
  PlugsConnectedIcon,
  XIcon,
} from "@phosphor-icons/react"
import { useState } from "react"
import { ByokSection } from "./apikeys/byok-section"
import { InteractionPreferences } from "./appearance/interaction-preferences"
import { LayoutSettings } from "./appearance/layout-settings"
import { ThemeSelection } from "./appearance/theme-selection"
import { ConnectionsPlaceholder } from "./connections/connections-placeholder"
import { DeveloperTools } from "./connections/developer-tools"
import { OllamaSection } from "./connections/ollama-section"
import { AccountManagement } from "./general/account-management"
import { ModelPreferences } from "./general/model-preferences"
import { UserProfile } from "./general/user-profile"

type SettingsContentProps = {
  onClose: () => void
  isDrawer?: boolean
}

type TabType = "general" | "appearance" | "connections"

export function SettingsContent({
  onClose,
  isDrawer = false,
}: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general")

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-y-auto",
        isDrawer ? "p-0 pb-16" : "py-0"
      )}
    >
      {isDrawer && (
        <div className="border-border mb-2 flex items-center justify-between border-b px-4 pb-2">
          <h2 className="text-lg font-medium">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        className={cn(
          "flex w-full flex-row",
          isDrawer ? "" : "flex min-h-[400px]"
        )}
      >
        {isDrawer ? (
          // Mobile version - tabs on top
          <div className="w-full items-start justify-start overflow-hidden py-4">
            <div>
              <TabsList className="mb-4 flex w-full min-w-0 flex-nowrap items-center justify-start overflow-x-auto bg-transparent px-0">
                <TabsTrigger
                  value="general"
                  className="ml-6 flex shrink-0 items-center gap-2"
                >
                  <GearSixIcon className="size-4" />
                  <span>General</span>
                </TabsTrigger>
                <TabsTrigger
                  value="appearance"
                  className="flex shrink-0 items-center gap-2"
                >
                  <PaintBrushIcon className="size-4" />
                  <span>Appearance</span>
                </TabsTrigger>
                <TabsTrigger
                  value="apikeys"
                  className="flex shrink-0 items-center gap-2"
                >
                  <KeyIcon className="size-4" />
                  <span>API Keys</span>
                </TabsTrigger>
                <TabsTrigger
                  value="connections"
                  className="flex shrink-0 items-center gap-2"
                >
                  <PlugsConnectedIcon className="size-4" />
                  <span>Connections</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile tabs content */}
            <TabsContent value="general" className="space-y-6 px-6">
              <UserProfile />
              {isSupabaseEnabled && (
                <>
                  <ModelPreferences />
                  <AccountManagement />
                </>
              )}
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 px-6">
              <ThemeSelection />
              <LayoutSettings />
              <InteractionPreferences />
            </TabsContent>

            <TabsContent value="apikeys" className="px-6">
              <ByokSection />
            </TabsContent>

            <TabsContent value="connections" className="space-y-6 px-6">
              {!isDev && <ConnectionsPlaceholder />}
              {isDev && <OllamaSection />}
              {isDev && <DeveloperTools />}
            </TabsContent>
          </div>
        ) : (
          // Desktop version - tabs on left
          <>
            <TabsList className="block w-48 rounded-none bg-transparent px-3 pt-4">
              <div className="flex w-full flex-col gap-1">
                <TabsTrigger
                  value="general"
                  className="w-full justify-start rounded-md px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <GearSixIcon className="size-4" />
                    <span>General</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="appearance"
                  className="w-full justify-start rounded-md px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <PaintBrushIcon className="size-4" />
                    <span>Appearance</span>
                  </div>
                </TabsTrigger>

                <TabsTrigger
                  value="apikeys"
                  className="w-full justify-start rounded-md px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <KeyIcon className="size-4" />
                    <span>API Keys</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="connections"
                  className="w-full justify-start rounded-md px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <PlugsConnectedIcon className="size-4" />
                    <span>Connections</span>
                  </div>
                </TabsTrigger>
              </div>
            </TabsList>

            {/* Desktop tabs content */}
            <div className="flex-1 overflow-auto px-6 pt-4">
              <TabsContent value="general" className="mt-0 space-y-6">
                <UserProfile />
                {isSupabaseEnabled && (
                  <>
                    <ModelPreferences />
                    <AccountManagement />
                  </>
                )}
              </TabsContent>

              <TabsContent value="appearance" className="mt-0 space-y-6">
                <ThemeSelection />
                <LayoutSettings />
                <InteractionPreferences />
              </TabsContent>

              <TabsContent value="apikeys" className="mt-0 space-y-6">
                <ByokSection />
              </TabsContent>

              <TabsContent value="connections" className="mt-0 space-y-6">
                {!isDev && <ConnectionsPlaceholder />}
                {isDev && <OllamaSection />}
                {isDev && <DeveloperTools />}
              </TabsContent>
            </div>
          </>
        )}
      </Tabs>
    </div>
  )
}
