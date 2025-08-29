"use client"

import { GithubLogo, Heart } from "@phosphor-icons/react"

export function Attribution() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">About Parley</h3>
        <p className="text-muted-foreground text-xs">
          Built for Kennesaw State University faculty and staff
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full border p-1.5 mt-0.5">
            <Heart className="size-3 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-medium">Based on Zola</p>
            <p className="text-muted-foreground text-xs">
              Open-source AI chat interface by{" "}
              <a 
                href="https://github.com/ibelick" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                @ibelick
              </a>
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="rounded-full border p-1.5 mt-0.5">
            <GithubLogo className="size-3" />
          </div>
          <div>
            <p className="text-xs font-medium">Open Source</p>
            <p className="text-muted-foreground text-xs">
              Original project:{" "}
              <a 
                href="https://github.com/ibelick/zola" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                github.com/ibelick/zola
              </a>
            </p>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <p className="text-muted-foreground text-xs">
            Customized for KSU with{" "}
            <a 
              href="https://claude.ai/code" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Claude Code
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}