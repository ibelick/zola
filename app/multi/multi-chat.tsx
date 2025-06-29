"use client"

import { MultiModelConversation } from "@/app/components/chat/multi-conversation"
import { toast } from "@/components/ui/toast"
import { getOrCreateGuestUserId } from "@/lib/api"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { fetchClient } from "@/lib/fetch"
import { useModel } from "@/lib/model-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { Message as MessageType } from "@ai-sdk/react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useMemo, useState } from "react"
// import { mockMessageGroups } from "./mock-data"
import { MultiChatInput } from "./multi-chat-input"
import { useMultiChat } from "./use-multi-chat"

// Import the exact types from MultiModelConversation to ensure compatibility
type GroupedMessage = {
  userMessage: MessageType
  responses: {
    model: string
    message: MessageType
    isLoading?: boolean
    provider: string
  }[]
  onDelete: (model: string, id: string) => void
  onEdit: (model: string, id: string, newText: string) => void
  onReload: (model: string) => void
}

export function MultiChat() {
  const [prompt, setPrompt] = useState("")
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [multiChatId, setMultiChatId] = useState<string | null>(null)
  const { user } = useUser()
  const { models } = useModel()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get chat session and messages similar to Chat component
  const { chatId } = useChatSession()
  const { messages: persistedMessages, cacheAndAddMessage } = useMessages()

  // Filter models to get real available models and transform them for useMultiChat
  const availableModels = useMemo(() => {
    return models.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
    }))
  }, [models])

  // Derive models from persisted messages for initialization and maintenance
  const modelsFromPersisted = useMemo(() => {
    return persistedMessages
      .filter((msg) => (msg as any).model)
      .map((msg) => (msg as any).model)
  }, [persistedMessages])

  // Derive models from last user message group for initialization
  const modelsFromLastGroup = useMemo(() => {
    // Find the last user message and its associated assistant messages
    const userMessages = persistedMessages.filter((msg) => msg.role === "user")
    if (userMessages.length === 0) return []

    const lastUserMessage = userMessages[userMessages.length - 1]
    const lastUserIndex = persistedMessages.indexOf(lastUserMessage)

    // Find all assistant messages after this user message (until next user message or end)
    const modelsInLastGroup: string[] = []
    for (let i = lastUserIndex + 1; i < persistedMessages.length; i++) {
      const msg = persistedMessages[i]
      if (msg.role === "user") break // Stop at next user message
      if (msg.role === "assistant" && (msg as any).model) {
        modelsInLastGroup.push((msg as any).model)
      }
    }
    return modelsInLastGroup
  }, [persistedMessages])

  // Track all models that need chat instances (current selection + historical)
  const allModelsToMaintain = useMemo(() => {
    const combined = [...new Set([...selectedModelIds, ...modelsFromPersisted])]
    return availableModels.filter((model) => combined.includes(model.id))
  }, [availableModels, selectedModelIds, modelsFromPersisted])

  // Initialize selectedModelIds from conversation history if empty
  if (selectedModelIds.length === 0 && modelsFromLastGroup.length > 0) {
    console.log(
      "Initializing selectedModelIds from last message group:",
      modelsFromLastGroup
    )
    setSelectedModelIds(modelsFromLastGroup)
  }

  // Use the custom hook to manage chat instances for all models (selected + previously used)
  const modelChats = useMultiChat(allModelsToMaintain)

  // Memoize system prompt
  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])

  // Compute message groups from persisted messages and live chat data
  const messageGroups = useMemo(() => {
    // Group persisted messages by message_group_id first
    const persistedGroups: { [key: string]: GroupedMessage } = {}

    // Process persisted messages from database/cache
    if (persistedMessages.length > 0) {
      console.log("Processing persisted messages:", persistedMessages)

      // For multi-model messages, we need to group them properly
      // Since message_group_id might not be available in persisted messages yet,
      // we'll group by analyzing the sequence of user/assistant messages

      const groups: {
        [key: string]: {
          userMessage: MessageType
          assistantMessages: MessageType[]
        }
      } = {}

      for (let i = 0; i < persistedMessages.length; i++) {
        const message = persistedMessages[i]

        if (message.role === "user") {
          // Use message content as grouping key for now
          const groupKey = message.content
          if (!groups[groupKey]) {
            groups[groupKey] = {
              userMessage: message,
              assistantMessages: [],
            }
          }
        } else if (message.role === "assistant") {
          // Find the most recent user message to associate this assistant message with
          let associatedUserMessage = null
          for (let j = i - 1; j >= 0; j--) {
            if (persistedMessages[j].role === "user") {
              associatedUserMessage = persistedMessages[j]
              break
            }
          }

          if (associatedUserMessage) {
            const groupKey = associatedUserMessage.content
            if (!groups[groupKey]) {
              groups[groupKey] = {
                userMessage: associatedUserMessage,
                assistantMessages: [],
              }
            }
            groups[groupKey].assistantMessages.push(message)
            console.log(
              `Associated assistant message "${message.content.slice(0, 50)}..." with user message "${groupKey}"`
            )
          }
        }
      }

      console.log("Grouped persisted messages:", groups)

      // Convert to GroupedMessage format
      Object.entries(groups).forEach(([groupKey, group]) => {
        if (group.userMessage) {
          persistedGroups[groupKey] = {
            userMessage: group.userMessage,
            responses: group.assistantMessages.map((msg, index) => {
              // Try to infer model from the message or use index-based fallback
              const model =
                (msg as any).model ||
                selectedModelIds[index] ||
                `model-${index}`
              const provider =
                models.find((m) => m.id === model)?.provider || "unknown"

              console.log(
                `Creating response for model: ${model}, provider: ${provider}`
              )

              return {
                model,
                message: msg,
                isLoading: false,
                provider,
              }
            }),
            onDelete: () => {},
            onEdit: () => {},
            onReload: () => {},
          }
        }
      })

      console.log("Final persistedGroups:", persistedGroups)
    }

    // Then add any currently loading messages from useMultiChat (real-time)
    const liveGroups = { ...persistedGroups }

    modelChats.forEach((chat) => {
      for (let i = 0; i < chat.messages.length; i += 2) {
        const userMsg = chat.messages[i]
        const assistantMsg = chat.messages[i + 1]

        if (userMsg?.role === "user") {
          const groupKey = userMsg.content

          if (!liveGroups[groupKey]) {
            liveGroups[groupKey] = {
              userMessage: userMsg,
              responses: [],
              onDelete: () => {},
              onEdit: () => {},
              onReload: () => {},
            }
          }

          if (assistantMsg?.role === "assistant") {
            // Check if this response already exists in persisted messages
            const existingResponse = liveGroups[groupKey].responses.find(
              (r) => r.model === chat.model.id
            )

            if (!existingResponse) {
              liveGroups[groupKey].responses.push({
                model: chat.model.id,
                message: assistantMsg,
                isLoading: false,
                provider: chat.model.provider,
              })
            }
          } else if (
            chat.isLoading &&
            userMsg.content === prompt &&
            selectedModelIds.includes(chat.model.id)
          ) {
            // Currently loading for this prompt - create a placeholder message (only for selected models)
            const placeholderMessage: MessageType = {
              id: `loading-${chat.model.id}`,
              role: "assistant",
              content: "",
            }
            liveGroups[groupKey].responses.push({
              model: chat.model.id,
              message: placeholderMessage,
              isLoading: true,
              provider: chat.model.provider,
            })
          }
        }
      }
    })

    console.log("Final liveGroups before setting:", liveGroups)
    return Object.values(liveGroups)
  }, [modelChats, prompt, selectedModelIds, persistedMessages, models])

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return

    if (selectedModelIds.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one model to chat with.",
        status: "error",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const uid = await getOrCreateGuestUserId(user)
      if (!uid) return

      // Generate a new message group ID for this user message
      const message_group_id = crypto.randomUUID()

      // Create a single chat for this multi-model session if it doesn't exist
      let chatIdToUse = multiChatId || chatId
      if (!chatIdToUse) {
        const createChatResponse = await fetchClient("/api/create-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: uid,
            title: "Multi-model conversation",
            model: selectedModelIds[0], // Use first selected model as default
            isAuthenticated: !!user?.id,
          }),
        })

        if (!createChatResponse.ok) {
          throw new Error("Failed to create multi-model chat")
        }

        const { chat: createdChat } = await createChatResponse.json()
        chatIdToUse = createdChat.id
        setMultiChatId(chatIdToUse)
      }

      // Send message only to currently selected models
      const selectedChats = modelChats.filter((chat) =>
        selectedModelIds.includes(chat.model.id)
      )

      // Send messages to all selected models using the same chat ID
      await Promise.all(
        selectedChats.map(async (chat) => {
          const options = {
            body: {
              chatId: chatIdToUse, // Use the same chat ID for all models
              userId: uid,
              model: chat.model.id,
              isAuthenticated: !!user?.id,
              systemPrompt: systemPrompt,
              enableSearch: false,
              message_group_id, // Pass the group ID to group messages
            },
          }

          chat.append(
            {
              role: "user",
              content: prompt,
            },
            options
          )
        })
      )

      setPrompt("") // Clear input after sending
      setFiles([]) // Clear files after sending
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        status: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    prompt,
    selectedModelIds,
    user,
    modelChats,
    systemPrompt,
    multiChatId,
    chatId,
  ])

  const handleFileUpload = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleFileRemove = useCallback((fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove))
  }, [])

  const handleStop = useCallback(() => {
    // Stop only currently selected models that are loading
    modelChats.forEach((chat) => {
      if (chat.isLoading && selectedModelIds.includes(chat.model.id)) {
        chat.stop()
      }
    })
  }, [modelChats, selectedModelIds])

  const anyLoading = useMemo(
    () =>
      modelChats.some(
        (chat) => chat.isLoading && selectedModelIds.includes(chat.model.id)
      ),
    [modelChats, selectedModelIds]
  )

  // Memoize the conversation props
  const conversationProps = useMemo(
    () => ({
      // messageGroups: mockMessages as any, // Use mock data for testing
      messageGroups,
    }),
    [messageGroups]
  )

  // Memoize the input props
  const inputProps = useMemo(
    () => ({
      value: prompt,
      onValueChange: setPrompt,
      onSend: handleSubmit,
      isSubmitting,
      files,
      onFileUpload: handleFileUpload,
      onFileRemove: handleFileRemove,
      selectedModelIds,
      onSelectedModelIdsChange: setSelectedModelIds,
      isUserAuthenticated: isAuthenticated,
      stop: handleStop,
      status: anyLoading ? ("streaming" as const) : ("ready" as const),
      anyLoading,
    }),
    [
      prompt,
      handleSubmit,
      isSubmitting,
      files,
      handleFileUpload,
      handleFileRemove,
      selectedModelIds,
      isAuthenticated,
      handleStop,
      anyLoading,
    ]
  )

  console.log("messageGroups", messageGroups)

  const showOnboarding = messageGroups.length === 0

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center",
        showOnboarding ? "justify-end md:justify-center" : "justify-end"
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
            <h1 className="mb-6 text-3xl font-medium tracking-tight">
              What's on your mind?
            </h1>
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            className="w-full flex-1 overflow-hidden"
            layout="position"
            layoutId="conversation"
            transition={{
              layout: {
                duration: messageGroups.length === 1 ? 0.3 : 0,
              },
            }}
          >
            <MultiModelConversation {...conversationProps} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* @todo: need to add title here below */}
      <motion.div
        className={cn(
          "z-50 mx-auto w-full max-w-3xl",
          showOnboarding ? "relative" : "absolute right-0 bottom-0 left-0"
        )}
        layout="position"
        layoutId="multi-chat-input-container"
        transition={{
          layout: {
            duration: messageGroups.length === 1 ? 0.3 : 0,
          },
        }}
      >
        <MultiChatInput {...inputProps} />
      </motion.div>
    </div>
  )
}
