"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { SourceUIPart } from "@ai-sdk/ui-utils"
import { Check, Copy, Link } from "@phosphor-icons/react"
import { useState } from "react"

type SourcesListProps = {
  sources: SourceUIPart["source"][]
  className?: string
}

export function SourcesList({ sources, className }: SourcesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Format URL for display (remove protocol and trailing slashes)
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
            <div className="flex-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary group flex items-center gap-1 hover:underline"
              >
                {source.title}
                <Link className="inline h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
              </a>
              <div className="text-muted-foreground text-xs">
                {formatUrl(source.url)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-6 w-6 p-0"
              onClick={() => copyToClipboard(source.url, source.id)}
              title="Copy URL"
            >
              {copiedId === source.id ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="sr-only">Copy URL</span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
