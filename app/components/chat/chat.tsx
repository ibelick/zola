"use client"

import { ChatInput } from "@/app/components/chat-input/chat-input"
import { Conversation } from "@/app/components/chat/conversation"
import { useModel } from "@/app/components/chat/use-model"
import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { toast } from "@/components/ui/toast"
import { getOrCreateGuestUserId } from "@/lib/api"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { MESSAGE_MAX_LENGTH, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { Attachment } from "@/lib/file-handling"
import { API_ROUTE_CHAT } from "@/lib/routes"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { Chat as ReactChat, useChat } from "@ai-sdk/react"
import { DefaultChatTransport, UIDataPartSchemas, UIMessage } from "ai"
import { AnimatePresence, motion } from "motion/react"
import dynamic from "next/dynamic"
import { redirect, useSearchParams } from "next/navigation"
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { z } from "zod"
import { useChatHandlers } from "./use-chat-handlers"
import { useChatUtils } from "./use-chat-utils"
import { useFileUpload } from "./use-file-upload"

const FeedbackWidget = dynamic(
  () => import("./feedback-widget").then((mod) => mod.FeedbackWidget),
  { ssr: false }
)

const DialogAuth = dynamic(
  () => import("./dialog-auth").then((mod) => mod.DialogAuth),
  { ssr: false }
)

function SearchParamsProvider({
  setInput,
}: {
  setInput: (input: string) => void
}) {
  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  if (prompt && typeof window !== "undefined") {
    requestAnimationFrame(() => setInput(prompt))
  }

  return null
}

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
})

export type MessageMetadata = z.infer<typeof messageMetadataSchema>

type UIMessageMetadata = MessageMetadata

type UIMessageDataParts = UIDataPartSchemas

export type UIMessageFull = UIMessage<UIMessageMetadata, UIMessageDataParts>

export function Chat() {
  const { chatId } = useChatSession()
  const {
    createNewChat,
    getChatById,
    updateChatModel,
    bumpChat,
    isLoading: isChatsLoading,
  } = useChats()

  const currentChat = useMemo(
    () => (chatId ? getChatById(chatId) : null),
    [chatId, getChatById]
  )

  const { messages: initialMessages, cacheAndAddMessage } = useMessages()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { preferences } = useUserPreferences()
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const [enableSearch, setEnableSearch] = useState(false)

  const {
    files,
    setFiles,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
    handleFileUpload,
    handleFileRemove,
  } = useFileUpload()

  const { selectedModel, handleModelChange } = useModel({
    currentChat: currentChat || null,
    user,
    updateChatModel,
    chatId,
  })

  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  const hasSentFirstMessageRef = useRef(false)
  const prevChatIdRef = useRef<string | null>(chatId)
  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])

  const { draftValue, clearDraft } = useChatDraft(chatId)

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  const [input, setInput] = useState("")

  // Handle errors directly in onError callback
  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error)
    console.error("Error message:", error.message)
    // The server now properly forwards error messages via getErrorMessage
    // So we can use the error message directly
    let errorMsg = error.message || "Something went wrong."

    // If the error message is still generic, provide a fallback
    if (errorMsg === "An error occurred" || errorMsg === "fetch failed") {
      errorMsg = "Something went wrong. Please try again."
    }

    toast({
      title: errorMsg,
      status: "error",
    })
  }, [])

  const {
    // id: chatIdFromUseChat,
    messages,
    status,
    error,
    regenerate,
    stop,
    setMessages,
    sendMessage,
  } = useChat<UIMessageFull>({
    chat: new ReactChat({
      messageMetadataSchema: messageMetadataSchema,
      id: chatId || "default",
      transport: new DefaultChatTransport({
        api: API_ROUTE_CHAT,
      }),
    }),
    onFinish: async (data) => {
      console.log("onFinish", { data })
      await cacheAndAddMessage(data.message)
    },
  })

  // Set initial input from draft if available
  useEffect(() => {
    if (draftValue) {
      setInput(draftValue)
    }
  }, [draftValue, setInput])

  const { checkLimitsAndNotify, ensureChatExists } = useChatUtils({
    isAuthenticated,
    chatId,
    messages,
    input,
    selectedModel,
    systemPrompt,
    createNewChat,
    setHasDialogAuth,
  })

  const { handleInputChange, handleDelete, handleEdit } = useChatHandlers({
    messages,
    setMessages,
    setInput,
    chatId,
  })
  // when chatId is null, set messages to an empty array
  useEffect(() => {
    if (chatId === null) {
      setMessages([])
    }
  }, [chatId, setMessages])

  useEffect(() => {
    if (error) {
      let errorMsg = "Something went wrong."
      try {
        const parsed = JSON.parse(error.message)
        errorMsg = parsed.error || errorMsg
      } catch {
        errorMsg = error.message || errorMsg
      }
      toast({
        title: errorMsg,
        status: "error",
      })
    }
  }, [error])

  const submit = useCallback(async () => {
    setIsSubmitting(true)

    const uid = await getOrCreateGuestUserId(user)
    if (!uid) {
      setIsSubmitting(false)
      return
    }

    const optimisticId = `optimistic-${Date.now().toString()}`
    // const optimisticAttachments =
    //   files.length > 0 ? createOptimisticAttachments(files) : []

    const optimisticMessage: UIMessageFull = {
      id: optimisticId,
      role: "user" as const,
      metadata: {
        createdAt: new Date().toISOString(),
      },
      parts: [{ type: "text" as const, text: input }],
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setInput("")

    const submittedFiles = [...files]
    setFiles([])

    try {
      const allowed = await checkLimitsAndNotify(uid)
      if (!allowed) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        return
      }

      const currentChatId = await ensureChatExists(uid)
      if (!currentChatId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        return
      }

      if (input.length > MESSAGE_MAX_LENGTH) {
        toast({
          title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
          status: "error",
        })
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        return
      }

      let attachments: Attachment[] | null = []
      if (submittedFiles.length > 0) {
        attachments = await handleFileUploads(uid, currentChatId)
        if (attachments === null) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
          // cleanupOptimisticAttachments(
          //   optimisticMessage.experimental_attachments
          // )
          return
        }
      }

      const options = {
        body: {
          chatId: currentChatId,
          userId: uid,
          model: selectedModel,
          isAuthenticated,
          systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
          enableSearch,
        },
        experimental_attachments: attachments || undefined,
      }

      sendMessage({ text: input }, options)
      // setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      cacheAndAddMessage(optimisticMessage)
      clearDraft()
      hasSentFirstMessageRef.current = true

      // Bump existing chats to top (non-blocking, after submit)
      // If messages.length === 0, this is a new chat that was just created
      if (messages.length > 0) {
        bumpChat(currentChatId)
      }
    } catch (submitError) {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      toast({ title: "Failed to send message", status: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    user,
    files,
    createOptimisticAttachments,
    input,
    setMessages,
    setInput,
    setFiles,
    checkLimitsAndNotify,
    cleanupOptimisticAttachments,
    ensureChatExists,
    handleFileUploads,
    selectedModel,
    isAuthenticated,
    systemPrompt,
    cacheAndAddMessage,
    clearDraft,
    messages.length,
    bumpChat,
    regenerate,
  ])

  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      setIsSubmitting(true)

      const uid = await getOrCreateGuestUserId(user)
      if (!uid) return

      const optimisticId = `optimistic-${Date.now().toString()}`

      const optimisticMessage: UIMessageFull = {
        id: optimisticId,
        role: "user" as const,
        metadata: {
          createdAt: new Date().toISOString(),
        },
        parts: [{ type: "text" as const, text: suggestion }],
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setInput("")

      const submittedFiles = [...files]
      setFiles([])

      const allowed = await checkLimitsAndNotify(uid)
      if (!allowed) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        setIsSubmitting(false)
        return
      }

      const currentChatId = await ensureChatExists(uid)

      if (!currentChatId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        setIsSubmitting(false)
        return
      }

      if (input.length > MESSAGE_MAX_LENGTH) {
        toast({
          title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
          status: "error",
        })
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        setIsSubmitting(false)
        return
      }

      let attachments: Attachment[] | null = []
      if (submittedFiles.length > 0) {
        attachments = await handleFileUploads(uid, currentChatId)
        if (attachments === null) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
          setIsSubmitting(false)
          return
        }
      }

      const options = {
        body: {
          chatId: currentChatId,
          userId: uid,
          model: selectedModel,
          isAuthenticated,
          systemPrompt: SYSTEM_PROMPT_DEFAULT,
        },
      }

      try {
        sendMessage({ text: input }, options)
        // setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        cacheAndAddMessage(optimisticMessage)
        clearDraft()
        hasSentFirstMessageRef.current = true
      } catch {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        // cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        toast({ title: "Failed to send message", status: "error" })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      ensureChatExists,
      selectedModel,
      user,
      // append,
      checkLimitsAndNotify,
      isAuthenticated,
      setMessages,
    ]
  )

  const handleReload = useCallback(async () => {
    const uid = await getOrCreateGuestUserId(user)
    if (!uid) {
      return
    }

    const options = {
      body: {
        chatId,
        userId: uid,
        model: selectedModel,
        isAuthenticated,
        systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
      },
    }

    regenerate(options)
  }, [user, chatId, selectedModel, isAuthenticated, systemPrompt, regenerate])

  // Memoize the conversation props to prevent unnecessary rerenders
  const conversationProps = useMemo(
    () => ({
      messages,
      status,
      onDelete: handleDelete,
      onEdit: handleEdit,
      onReload: handleReload,
    }),
    [messages, status, handleDelete, handleEdit, handleReload]
  )

  // Memoize the chat input props
  const chatInputProps = useMemo(
    () => ({
      value: input,
      onSuggestion: handleSuggestion,
      onValueChange: handleInputChange,
      onSend: submit,
      isSubmitting,
      files,
      onFileUpload: handleFileUpload,
      onFileRemove: handleFileRemove,
      hasSuggestions:
        preferences.promptSuggestions && !chatId && messages.length === 0,
      onSelectModel: handleModelChange,
      selectedModel,
      isUserAuthenticated: isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
    }),
    [
      input,
      handleSuggestion,
      handleInputChange,
      submit,
      isSubmitting,
      files,
      handleFileUpload,
      handleFileRemove,
      preferences.promptSuggestions,
      chatId,
      messages.length,
      handleModelChange,
      selectedModel,
      isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
    ]
  )

  // Handle redirect for invalid chatId - only redirect if we're certain the chat doesn't exist
  // and we're not in a transient state during chat creation
  if (
    chatId &&
    !isChatsLoading &&
    !currentChat &&
    !isSubmitting &&
    status === "ready" &&
    messages.length === 0 &&
    !hasSentFirstMessageRef.current // Don't redirect if we've already sent a message in this session
  ) {
    return redirect("/")
  }

  const showOnboarding = !chatId && messages.length === 0

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center justify-end md:justify-center"
      )}
    >
      <DialogAuth open={hasDialogAuth} setOpen={setHasDialogAuth} />

      <Suspense>
        <SearchParamsProvider setInput={setInput} />
      </Suspense>

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
              What&apos;s on your mind?
            </h1>
          </motion.div>
        ) : (
          <Conversation key="conversation" {...conversationProps} />
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
            duration: messages.length === 1 ? 0.3 : 0,
          },
        }}
      >
        <ChatInput {...chatInputProps} />

        {/* <ChatInput

          // value={input}
          // onSuggestion={handleSuggestion}
          // onValueChange={handleInputChange}
          // onSend={submit}
          // isSubmitting={isSubmitting}
          // files={files}
          // onFileUpload={handleFileUpload}
          // onFileRemove={handleFileRemove}
          // hasSuggestions={
          //   preferences.promptSuggestions && !chatId && messages.length === 0
          // }
          // onSelectModel={handleModelChange}
          // selectedModel={selectedModel}
          // isUserAuthenticated={isAuthenticated}
          // stop={stop}
          // status={status}
          // enableSearch={enableSearch}
          // setEnableSearch={setEnableSearch}
          // hasMessages
          // onSearchToggle={handleSearchToggle}
        /> */}
      </motion.div>

      <FeedbackWidget authUserId={user?.id} />
    </div>
  )
}
