"use client"

import { ChatInput } from "@/app/components/chat-input/chat-input"
import { useFileUpload } from "@/app/components/chat/use-file-upload"
import { getOrCreateGuestUserId } from "@/lib/api"
import { useChats } from "@/lib/chat-store/chats/provider"
import { MODEL_DEFAULT } from "@/lib/config"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { ChatCircleIcon } from "@phosphor-icons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

type Project = {
  id: string
  name: string
  user_id: string
  created_at: string
}

type Chat = {
  id: string
  title: string
  created_at: string
  updated_at: string
  project_id: string | null
  user_id: string
  model: string
}

type ProjectViewProps = {
  projectId: string
}

export function ProjectView({ projectId }: ProjectViewProps) {
  const [input, setInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { preferences } = useUserPreferences()
  const { createNewChat } = useChats()

  const { files, setFiles, handleFileUpload, handleFileRemove } =
    useFileUpload()

  // Fetch project details
  const { data: project } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch project")
      }
      return response.json()
    },
  })

  // Get chats from the chat store and filter for this project
  const { chats: allChats, isLoading: chatsLoading } = useChats()

  // Filter chats for this project
  const chats = allChats.filter((chat) => chat.project_id === projectId)

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return

    setIsSubmitting(true)
    try {
      const uid = await getOrCreateGuestUserId(user)
      if (!uid) {
        throw new Error("Failed to get user ID")
      }

      // Create new chat with project association
      const newChat = await createNewChat(
        uid,
        input.trim(), // Use the message as the title
        MODEL_DEFAULT,
        !!user?.id,
        undefined, // system prompt
        undefined, // agent ID
        projectId // Add projectId parameter
      )

      if (!newChat) {
        throw new Error("Failed to create chat")
      }

      // Navigate to the chat and include the first message as a URL param
      router.push(`/c/${newChat.id}?prompt=${encodeURIComponent(input)}`)
      setInput("")
    } catch (error) {
      console.error("Failed to create chat:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [input, createNewChat, user, projectId, router])

  const handleInputChange = useCallback((value: string) => {
    setInput(value)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Memoize the chat input props similar to chat.tsx
  const chatInputProps = useMemo(
    () => ({
      value: input,
      onValueChange: handleInputChange,
      onSend: handleSubmit,
      isSubmitting,
      files,
      onFileUpload: handleFileUpload,
      onFileRemove: handleFileRemove,
      onSuggestion: () => {}, // No suggestions in project view
      hasSuggestions: false,
      onSelectModel: () => {}, // No model selection in project view
      selectedModel: MODEL_DEFAULT,
      isUserAuthenticated: !!user?.id,
      stop: () => {}, // No stop functionality needed here
      status: "ready" as const,
    }),
    [
      input,
      handleInputChange,
      handleSubmit,
      isSubmitting,
      files,
      handleFileUpload,
      handleFileRemove,
      user?.id,
    ]
  )

  const showOnboarding = chats.length === 0

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center justify-end md:justify-center"
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {showOnboarding ? (
          <motion.div
            key="onboarding"
            className="absolute bottom-[60%] mx-auto max-w-[50rem] md:relative md:bottom-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            layoutId="onboarding"
            transition={{
              layout: {
                duration: 0,
              },
            }}
          >
            <div className="mb-2 flex items-center justify-center">
              <div className="text-muted-foreground flex items-center gap-2">
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                  <ChatCircleIcon size={16} />
                </div>
                <span className="text-lg font-medium">
                  {project?.name || "Project"}
                </span>
              </div>
            </div>
            <h1 className="mb-6 text-center text-3xl font-medium tracking-tight">
              What&apos;s on your mind?
            </h1>
          </motion.div>
        ) : (
          <div key="project-chats" className="w-full max-w-3xl">
            <div className="mb-6 flex items-center justify-center">
              <div className="text-muted-foreground flex items-center gap-2">
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                  <ChatCircleIcon size={16} />
                </div>
                <span className="text-lg font-medium">
                  {project?.name || "Project"}
                </span>
              </div>
            </div>

            {/* Recent Chats */}
            <div className="mb-6">
              <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                Recent conversations
              </h2>
              <div className="space-y-2">
                {chats.slice(0, 3).map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/c/${chat.id}`}
                    className="border-border hover:bg-accent/50 block rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium">{chat.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {chat.updated_at
                            ? formatDate(chat.updated_at)
                            : chat.created_at
                              ? formatDate(chat.created_at)
                              : null}
                        </p>
                      </div>
                      <ChatCircleIcon
                        size={16}
                        className="text-muted-foreground ml-2 flex-shrink-0"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          "relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl"
        )}
        layout="position"
        layoutId="chat-input-container"
        transition={{
          layout: {
            duration: 0.3,
          },
        }}
      >
        <ChatInput {...chatInputProps} />
      </motion.div>
    </div>
  )
}
