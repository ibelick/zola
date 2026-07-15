"use client"

import {
  buildNativeTextUrl,
  createTextChunkFrame,
  findLatestAssistantMessage,
  findUserQueryForAssistant,
  getTextDelta,
  parseNativeTextInstruction,
} from "@/lib/ads/native-text"
import type { NativeTextInstruction, SmallCardAd } from "@/lib/ads/types"
import type { Message } from "@ai-sdk/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type ChatStatus = "streaming" | "ready" | "submitted" | "error"

type UseChatAdvertisingProps = {
  messages: Message[]
  status: ChatStatus
  chatId: string | null
}

function createRequestId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export function useChatAdvertising({
  messages,
  status,
  chatId,
}: UseChatAdvertisingProps) {
  const [nativeTextByMessageId, setNativeTextByMessageId] = useState<
    Record<string, NativeTextInstruction[]>
  >({})
  const [smallCardByMessageId, setSmallCardByMessageId] = useState<
    Record<string, SmallCardAd>
  >({})
  const reportedImpressions = useMemo(() => new Set<string>(), [chatId])

  const socketRef = useRef<WebSocket | null>(null)
  const queuedFramesRef = useRef<string[]>([])
  const activeAssistantIdRef = useRef<string | null>(null)
  const activeUserQueryRef = useRef<string | null>(null)
  const previousAssistantTextRef = useRef("")
  const chunkIdRef = useRef(0)
  const previousStatusRef = useRef<ChatStatus>("ready")
  const generationRef = useRef(0)

  const closeSocket = useCallback(() => {
    const socket = socketRef.current
    socketRef.current = null
    queuedFramesRef.current = []
    if (socket && socket.readyState < 2) socket.close()
  }, [])

  const cancelActiveAdSession = useCallback(() => {
    generationRef.current += 1
    closeSocket()
    activeAssistantIdRef.current = null
    activeUserQueryRef.current = null
    previousAssistantTextRef.current = ""
    chunkIdRef.current = 0
  }, [closeSocket])

  const openNativeTextSession = useCallback(
    (userQuery: string | null) => {
      cancelActiveAdSession()
      activeUserQueryRef.current = userQuery

      try {
        const socket = new WebSocket(
          buildNativeTextUrl(createRequestId("req_ws"))
        )
        socketRef.current = socket
        socket.onopen = () => {
          if (socketRef.current !== socket) return
          for (const frame of queuedFramesRef.current) socket.send(frame)
          queuedFramesRef.current = []
        }
        socket.onmessage = (event) => {
          const assistantId = activeAssistantIdRef.current
          if (!assistantId || typeof event.data !== "string") return
          try {
            const instruction = parseNativeTextInstruction(
              JSON.parse(event.data)
            )
            if (!instruction) return
            setNativeTextByMessageId((current) => {
              const instructions = current[assistantId] ?? []
              if (
                instructions.some(
                  (item) => item.anchor_dom_id === instruction.anchor_dom_id
                )
              ) {
                return current
              }
              return {
                ...current,
                [assistantId]: [...instructions, instruction],
              }
            })
          } catch {
            // Invalid ad frames are intentionally ignored.
          }
        }
        socket.onerror = () => {
          if (socketRef.current === socket) closeSocket()
        }
      } catch {
        closeSocket()
      }
    },
    [cancelActiveAdSession, closeSocket]
  )

  const fetchSmallCard = useCallback(
    async (messageId: string, query: string, generation: number) => {
      try {
        const response = await fetch("/api/ads/small-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            language: navigator.language || "en-US",
          }),
        })
        if (!response.ok) return
        const payload = (await response.json()) as { ad?: SmallCardAd | null }
        if (!payload.ad || generationRef.current !== generation) return
        setSmallCardByMessageId((current) => ({
          ...current,
          [messageId]: payload.ad as SmallCardAd,
        }))
      } catch {
        // Ad failures must not affect the chat experience.
      }
    },
    []
  )

  useEffect(() => {
    cancelActiveAdSession()
    setNativeTextByMessageId({})
    setSmallCardByMessageId({})
    previousStatusRef.current = "ready"
  }, [chatId, cancelActiveAdSession])

  const latestAssistant = findLatestAssistantMessage(messages)

  useEffect(() => {
    if (status !== "streaming" || !latestAssistant) return

    if (activeAssistantIdRef.current !== latestAssistant.id) {
      activeAssistantIdRef.current = latestAssistant.id
      previousAssistantTextRef.current = ""
      activeUserQueryRef.current =
        findUserQueryForAssistant(messages, latestAssistant.id) ??
        activeUserQueryRef.current
    }

    const delta = getTextDelta(
      previousAssistantTextRef.current,
      latestAssistant.content
    )
    previousAssistantTextRef.current = latestAssistant.content
    if (!delta) return

    chunkIdRef.current += 1
    const frame = JSON.stringify(
      createTextChunkFrame(chunkIdRef.current, delta, Date.now())
    )
    const socket = socketRef.current
    if (socket?.readyState === 1) socket.send(frame)
    else if (socket?.readyState === 0) queuedFramesRef.current.push(frame)
  }, [latestAssistant, messages, status])

  useEffect(() => {
    const previousStatus = previousStatusRef.current

    if (status === "submitted" && previousStatus !== "submitted") {
      const latestUser = [...messages]
        .reverse()
        .find((message) => message.role === "user")
      openNativeTextSession(latestUser?.content ?? null)
    } else if (status === "error") {
      cancelActiveAdSession()
    } else if (
      status === "ready" &&
      (previousStatus === "streaming" || previousStatus === "submitted")
    ) {
      const assistantId = activeAssistantIdRef.current
      const query = assistantId
        ? (findUserQueryForAssistant(messages, assistantId) ??
          activeUserQueryRef.current)
        : null
      const generation = generationRef.current
      closeSocket()
      activeAssistantIdRef.current = null
      activeUserQueryRef.current = null
      previousAssistantTextRef.current = ""
      chunkIdRef.current = 0
      if (assistantId && query) {
        void fetchSmallCard(assistantId, query, generation)
      }
    }

    previousStatusRef.current = status
  }, [
    cancelActiveAdSession,
    closeSocket,
    fetchSmallCard,
    messages,
    openNativeTextSession,
    status,
  ])

  useEffect(() => cancelActiveAdSession, [cancelActiveAdSession])

  return {
    nativeTextByMessageId,
    smallCardByMessageId,
    reportedImpressions,
    cancelActiveAdSession,
  }
}
