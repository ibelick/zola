"use client"

import { cn } from "@/lib/utils"
import type { SourceUIPart } from "@ai-sdk/ui-utils"
import { CaretDown, Link } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

type SourcesListProps = {
  sources: SourceUIPart["source"][]
  className?: string
}

const getFavicon = (url: string) => {
  const domain = new URL(url).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

const addUTM = (url: string) => {
  const u = new URL(url)
  u.searchParams.set("utm_source", "zola.chat")
  u.searchParams.set("utm_medium", "research")
  return u.toString()
}

const TRANSITION = {
  type: "spring",
  duration: 0.2,
  bounce: 0,
}

export function SourcesList({ sources, className }: SourcesListProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatUrl = (url: string) => {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .replace(/^www\./, "")
  }

  return (
    <div className={cn("my-4", className)}>
      <div className="border-border flex flex-col gap-0 overflow-hidden rounded-md border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="hover:bg-accent flex w-full flex-row items-center rounded-t-md px-3 py-2 transition-colors"
        >
          <div className="flex flex-1 flex-row items-center gap-2 text-left text-base">
            Sources
            <div className="flex -space-x-1">
              {sources.slice(0, 3).map((source) => (
                <img
                  key={source.id}
                  src={getFavicon(source.url)}
                  alt={`Favicon for ${source.title}`}
                  className="border-background h-4 w-4 rounded-sm border"
                />
              ))}
              {sources.length > 3 && (
                <span className="text-muted-foreground ml-1 text-xs">
                  +{sources.length - 3}
                </span>
              )}
            </div>
          </div>
          <CaretDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180 transform" : ""
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={TRANSITION}
              className="overflow-hidden"
            >
              <ul className="space-y-2 px-3 pt-3 pb-3">
                {sources.map((source) => (
                  <li key={source.id} className="flex items-center text-sm">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <a
                        href={addUTM(source.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary group line-clamp-1 flex items-center gap-1 hover:underline"
                      >
                        <img
                          src={getFavicon(source.url)}
                          alt={`Favicon for ${source.title}`}
                          className="h-4 w-4 flex-shrink-0 rounded-sm"
                        />
                        <span className="truncate">{source.title}</span>
                        <Link className="inline h-3 w-3 flex-shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
                      </a>
                      <div className="text-muted-foreground line-clamp-1 text-xs">
                        {formatUrl(source.url)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
