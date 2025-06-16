"use client"

import { cn } from "@/lib/utils"
import { FolderIcon, FolderPlusIcon } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState } from "react"
import { DialogCreateProject } from "./dialog-create-project"

type Project = {
  id: string
  name: string
  user_id: string
  created_at: string
}

export function SidebarProject() {
  const pathname = usePathname()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      return response.json()
    },
  })

  return (
    <div className="mb-5">
      <button
        className="hover:bg-accent/80 hover:text-foreground text-primary group/new-chat relative inline-flex w-full items-center rounded-md bg-transparent px-2 py-2 text-sm transition-colors"
        type="button"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-center gap-2">
          <FolderPlusIcon size={20} />
          New project
        </div>
      </button>

      {isLoading ? null : (
        <div className="space-y-1">
          {projects.map((project) => {
            const isActive = pathname.startsWith(`/p/${project.id}`)

            return (
              <Link
                href={`/p/${project.id}`}
                className={cn(
                  "hover:bg-accent/80 hover:text-foreground group/chat relative inline-flex w-full items-center rounded-md transition-colors",
                  isActive && "bg-accent hover:bg-accent text-foreground"
                )}
                prefetch
              >
                <div
                  className="text-primary relative line-clamp-1 flex w-full items-center gap-2 mask-r-from-80% mask-r-to-85% px-2 py-2 text-sm text-ellipsis whitespace-nowrap"
                  title={project.name}
                >
                  <FolderIcon size={20} />

                  {project.name}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <DialogCreateProject isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
    </div>
  )
}
