"use client"

import { ChatInput } from "@/app/components/chat-input/chat-input"
import { Conversation } from "@/app/components/chat/conversation"
import { useChatSession } from "@/app/providers/chat-session-provider"
import { useUser } from "@/app/providers/user-provider"
import { toast } from "@/components/ui/toast"
import { useAgent } from "@/lib/agent-store/hooks"
import { getOrCreateGuestUserId } from "@/lib/api"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import {
  MESSAGE_MAX_LENGTH,
  MODEL_DEFAULT,
  SYSTEM_PROMPT_DEFAULT,
} from "@/lib/config"
import { Attachment } from "@/lib/file-handling"
import { API_ROUTE_CHAT } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { Message, useChat } from "@ai-sdk/react"
import { AnimatePresence, motion } from "motion/react"
import dynamic from "next/dynamic"
import { redirect, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { useChatHandlers } from "./use-chat-handlers"
import { useChatUtils } from "./use-chat-utils"
import { useFileUpload } from "./use-file-upload"
import { useReasoning } from "./use-reasoning"

const FeedbackWidget = dynamic(
  () => import("./feedback-widget").then((mod) => mod.FeedbackWidget),
  { ssr: false }
)

const DialogAuth = dynamic(
  () => import("./dialog-auth").then((mod) => mod.DialogAuth),
  { ssr: false }
)

export function Chat() {
  const { chatId } = useChatSession()
  const {
    createNewChat,
    getChatById,
    updateChatModel,
    isLoading: isChatsLoading,
  } = useChats()
  const currentChat = chatId ? getChatById(chatId) : null
  const { messages: initialMessages, cacheAndAddMessage } = useMessages()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const {
    files,
    setFiles,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
    handleFileUpload,
    handleFileRemove,
  } = useFileUpload()
  const [selectedModel, setSelectedModel] = useState(
    currentChat?.model || user?.preferred_model || MODEL_DEFAULT
  )
  const [systemPrompt, setSystemPrompt] = useState(
    currentChat?.system_prompt || SYSTEM_PROMPT_DEFAULT
  )
  const [hydrated, setHydrated] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasSentInitialPromptRef = useRef(false)
  const hasSentFirstMessageRef = useRef(false)
  const { callAgent, isTooling, statusCall, agent } = useAgent()

  const isAuthenticated = !!user?.id
  const {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
  } = useChat({
    api: API_ROUTE_CHAT,
    initialMessages,
    // save assistant to messages data layer
    onFinish: async (message) => {
      if (!chatId) return
      await cacheAndAddMessage(message)
    },
  })

  // Use the custom hook for chat utilities
  const { checkLimitsAndNotify, ensureChatExists } = useChatUtils({
    isAuthenticated,
    chatId,
    messages,
    input,
    selectedModel,
    systemPrompt,
    selectedAgentId: agent?.id || null,
    createNewChat,
    setHasDialogAuth,
  })

  // @todo: improve
  const {
    reasoningInput,
    reasoningMessages,
    appendReasoning,
    setReasoningMessages,
    reasoningStatus,
  } = useReasoning()

  const {
    handleInputChange,
    handleSelectSystemPrompt,
    handleModelChange,
    handleDelete,
    handleEdit,
  } = useChatHandlers({
    messages,
    setMessages,
    setInput,
    setSystemPrompt,
    setSelectedModel,
    selectedModel,
    chatId,
    updateChatModel,
    user,
  })

  // when chatId is null, set messages to an empty array
  useEffect(() => {
    if (chatId === null) {
      setMessages([])
    }
  }, [chatId])

  useEffect(() => {
    if (currentChat?.system_prompt) {
      setSystemPrompt(currentChat?.system_prompt)
    }
  }, [currentChat])

  useEffect(() => {
    setHydrated(true)
  }, [])

  // handle errors
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

  useEffect(() => {
    const prompt = searchParams.get("prompt")
    if (prompt) {
      setInput(prompt)
    }
  }, [searchParams])

  const handleAgent = async (prompt: string, uid: string, chatId: string) => {
    try {
      const { markdown, parts } = await callAgent({
        prompt,
        chatId,
        userId: uid,
      })

      const agentMessage = {
        role: "assistant",
        content: markdown,
        parts,
        id: `agent-${Date.now()}`,
      } as Message

      setMessages((prev) => [...prev, agentMessage])

      await cacheAndAddMessage(agentMessage)
    } catch (err: any) {
      console.error("Zola Agent Error:", err)
      toast({
        title: "Zola Agent failed",
        description: err.message || "Something went wrong.",
        status: "error",
      })
    }
  }

  const submit = async () => {
    setIsSubmitting(true)

    const uid = await getOrCreateGuestUserId(user)
    if (!uid) return

    const optimisticId = `optimistic-${Date.now().toString()}`
    const optimisticAttachments =
      files.length > 0 ? createOptimisticAttachments(files) : []

    const optimisticMessage = {
      id: optimisticId,
      content: input,
      role: "user" as const,
      createdAt: new Date(),
      experimental_attachments:
        optimisticAttachments.length > 0 ? optimisticAttachments : undefined,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setInput("")

    const submittedFiles = [...files]
    setFiles([])

    const allowed = await checkLimitsAndNotify(uid)
    if (!allowed) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      setIsSubmitting(false)
      return
    }

    const currentChatId = await ensureChatExists(uid)
    if (!currentChatId) {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      setIsSubmitting(false)
      return
    }

    if (input.length > MESSAGE_MAX_LENGTH) {
      toast({
        title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
        status: "error",
      })
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      setIsSubmitting(false)
      return
    }

    let attachments: Attachment[] | null = []
    if (submittedFiles.length > 0) {
      attachments = await handleFileUploads(uid, currentChatId)
      if (attachments === null) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
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
        systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
        ...(agent?.id && { agentId: agent.id }),
      },
      experimental_attachments: attachments || undefined,
    }

    // if its an agent with tooling and first message
    // we need to handle the agent call differently
    if (isTooling && messages.length === 0) {
      // appendReasoning({ role: "user", content: input })
      await handleAgent(input, uid, currentChatId)
      setIsSubmitting(false)
      return
    }

    try {
      handleSubmit(undefined, options)
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      cacheAndAddMessage(optimisticMessage)

      hasSentFirstMessageRef.current = true
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      toast({ title: "Failed to send message", status: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      setIsSubmitting(true)
      const optimisticId = `optimistic-${Date.now().toString()}`
      const optimisticMessage = {
        id: optimisticId,
        content: suggestion,
        role: "user" as const,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, optimisticMessage])

      const uid = await getOrCreateGuestUserId(user)

      if (!uid) {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        setIsSubmitting(false)
        return
      }

      const allowed = await checkLimitsAndNotify(uid)
      if (!allowed) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        setIsSubmitting(false)
        return
      }

      const currentChatId = await ensureChatExists(uid)

      if (!currentChatId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        setIsSubmitting(false)
        return
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

      append(
        {
          role: "user",
          content: suggestion,
        },
        options
      )
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      setIsSubmitting(false)
    },
    [ensureChatExists, selectedModel, user?.id, append]
  )

  const handleReload = async () => {
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

    reload(options)
  }

  // not user chatId and no messages
  if (hydrated && chatId && !isChatsLoading && !currentChat) {
    return redirect("/")
  }

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center justify-end md:justify-center"
      )}
    >
      <DialogAuth open={hasDialogAuth} setOpen={setHasDialogAuth} />
      <AnimatePresence initial={false} mode="popLayout">
        {!chatId && messages.length === 0 ? (
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
          <Conversation
            key="conversation"
            messages={messages}
            status={status}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onReload={handleReload}
            agentStatus={statusCall}
            reasoning={
              reasoningMessages?.find((m) => m.role === "assistant")?.content
            }
          />
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
        <ChatInput
          value={input}
          onSuggestion={handleSuggestion}
          onValueChange={handleInputChange}
          onSend={submit}
          isSubmitting={isSubmitting}
          files={files}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          hasSuggestions={!chatId && messages.length === 0}
          onSelectModel={handleModelChange}
          onSelectSystemPrompt={handleSelectSystemPrompt}
          selectedModel={selectedModel}
          isUserAuthenticated={isAuthenticated}
          systemPrompt={systemPrompt}
          stop={stop}
          status={status}
          placeholder={
            isTooling && messages.length === 0
              ? "Describe what you want to research in detail, e.g. a specific company, trend, or question. Add context like audience, angle, goals, or examples to help me create a focused and useful report."
              : "Ask Zola anything"
          }
        />
      </motion.div>
      <FeedbackWidget authUserId={user?.id} />
    </div>
  )
}
