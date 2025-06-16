import { FolderIcon } from "@phosphor-icons/react"
import React from "react"

export function SidebarProject() {
  return (
    <div className="mb-5">
      <button
        className="hover:bg-accent/80 hover:text-foreground text-primary group/new-chat relative inline-flex w-full items-center rounded-md bg-transparent px-2 py-2 text-sm transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <FolderIcon size={20} />
          New project
        </div>
      </button>
    </div>
  )
}
