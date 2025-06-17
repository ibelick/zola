"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { fetchClient } from "@/lib/fetch"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"

type Project = {
  id: string
  name: string
  user_id: string
  created_at: string
}

type DialogDeleteProjectProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  project: Project
}

export function DialogDeleteProject({
  isOpen,
  setIsOpen,
  project,
}: DialogDeleteProjectProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetchClient(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete project")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["chats"] })
      setIsOpen(false)

      // If we're currently viewing this project, redirect to home
      if (pathname.startsWith(`/p/${project.id}`)) {
        router.push("/")
      }
    },
  })

  const handleConfirmDelete = () => {
    deleteProjectMutation.mutate(project.id)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{project.name}&quot;? This
            action cannot be undone and will also delete all conversations in
            this project.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={deleteProjectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={deleteProjectMutation.isPending}
          >
            {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
