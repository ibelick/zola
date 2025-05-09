import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AgentProvider } from "@/lib/agent-store/provider"
import { ChatsProvider } from "@/lib/chat-store/chats/provider"
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config"
import { ThemeProvider } from "next-themes"
import Script from "next/script"
import { createClient } from "../lib/supabase/server"
import { LayoutClient } from "./layout-client"
import { ChatSessionProvider } from "./providers/chat-session-provider"
import { UserProvider } from "./providers/user-provider"
import { UserProfile } from "./types/user"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isDev = process.env.NODE_ENV === "development"
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  let userProfile = null
  if (data.user) {
    const { data: userProfileData } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user?.id)
      .single()

    userProfile = {
      ...userProfileData,
      profile_image: data.user?.user_metadata.avatar_url,
      display_name: data.user?.user_metadata.name,
    } as UserProfile
  }

  return (
    <html lang="en" suppressHydrationWarning>
      {!isDev ? (
        <Script
          async
          src="https://analytics.umami.is/script.js"
          data-website-id="42e5b68c-5478-41a6-bc68-088d029cee52"
        />
      ) : null}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LayoutClient />
        <UserProvider initialUser={userProfile}>
          <ChatsProvider userId={userProfile?.id}>
            <ChatSessionProvider>
              <AgentProvider>
                <TooltipProvider delayDuration={200} skipDelayDuration={500}>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <Toaster position="top-center" />
                    {children}
                  </ThemeProvider>
                </TooltipProvider>
              </AgentProvider>
            </ChatSessionProvider>
          </ChatsProvider>
        </UserProvider>
      </body>
    </html>
  )
}
