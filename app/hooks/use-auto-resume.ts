"use client"

import type { UseChatHelpers } from "@ai-sdk/react"
import type { Message } from "ai"
import { useEffect } from "react"

export type DataPart = { type: "append-message"; message: string }

export interface Props {
  autoResume?: boolean
  initialMessages: Message[]
  experimental_resume: UseChatHelpers["experimental_resume"]
  data: UseChatHelpers["data"]
  setMessages: UseChatHelpers["setMessages"]
}

export function useAutoResume({
  autoResume = false,
  initialMessages,
  experimental_resume,
  data,
  setMessages,
}: Props) {
  useEffect(() => {
    if (!autoResume) return

    const mostRecentMessage = initialMessages.at(-1)

    if (mostRecentMessage?.role === "user") {
      experimental_resume()
    }

    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!data || data.length === 0) return

    const dataPart = data[0] as DataPart

    if (dataPart.type === "append-message") {
      const message = JSON.parse(dataPart.message) as Message
      setMessages([...initialMessages, message])
    }
  }, [data, initialMessages, setMessages])
}
