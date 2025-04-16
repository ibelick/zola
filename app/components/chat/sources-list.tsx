"use client"

import { cn } from "@/lib/utils"
import type { SourceUIPart } from "@ai-sdk/ui-utils"
import { Link } from "@phosphor-icons/react"

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

export function SourcesList({ sources, className }: SourcesListProps) {
  const formatUrl = (url: string) => {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .replace(/^www\./, "")
  }

  return (
    <div className={cn("my-4", className)}>
      <h3 className="mb-2 text-base">Sources</h3>
      <ul className="space-y-2">
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
                  alt=""
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
    </div>
  )
}
