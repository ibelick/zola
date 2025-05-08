"use client"

import { HistoryTrigger } from "@/app/components/history/history-trigger"
import { AppInfoTrigger } from "@/app/components/layout/app-info/app-info-trigger"
import { ButtonNewChat } from "@/app/components/layout/button-new-chat"
import { UserMenu } from "@/app/components/layout/user-menu"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useUser } from "@/app/providers/user-provider"
import type { Agent } from "@/app/types/agent"
import { Button } from "@/components/ui/button"
import { useAgent } from "@/lib/agent-store/hooks"
import { APP_NAME } from "@/lib/config"
import { Info } from "@phosphor-icons/react"
import Link from "next/link"
import { AgentLink } from "./agent-link"
import { DialogPublish } from "./dialog-publish"
import { HeaderAgent } from "./header-agent"

export type AgentHeader = Pick<
  Agent,
  "name" | "description" | "avatar_url" | "slug"
>

export function Header() {
  const isMobile = useBreakpoint(768)
  const { user } = useUser()
  const { agent } = useAgent()

  const isLoggedIn = !!user

  return (
    <div className="flex flex-1 items-center justify-between">
      {Boolean(!agent || !isMobile) && (
        <div className="flex-1">
          <Link href="/" className="text-xl font-medium tracking-tight">
            {APP_NAME}
          </Link>
        </div>
      )}
      <HeaderAgent agent={agent} />
      {!isLoggedIn ? (
        <div className="flex flex-1 items-center justify-end gap-4">
          <AppInfoTrigger
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-muted text-muted-foreground h-8 w-8 rounded-full"
                aria-label={`About ${APP_NAME}`}
              >
                <Info className="size-4" />
              </Button>
            }
          />
          <AgentLink />
          <Link
            href="/auth"
            className="font-base text-muted-foreground hover:text-foreground text-base transition-colors"
          >
            Login
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-end gap-2">
          {agent && <DialogPublish agent={agent} />}
          <ButtonNewChat />
          <AgentLink />
          <HistoryTrigger />
          <UserMenu />
        </div>
      )}
    </div>
  )
}
