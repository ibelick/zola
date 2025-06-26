import { UIMessage } from "@ai-sdk/react"
import React, { useState } from "react"
import { MessageAssistant } from "./message-assistant"
import { MessageUser } from "./message-user"
import { UIMessageFull } from "./use-chat-core"

type MessageProps = {
  variant: UIMessage["role"]
  id: string
  isLast?: boolean
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => void
  onReload: () => void
  hasScrollAnchor?: boolean
  parts?: UIMessageFull["parts"]
  status?: "streaming" | "ready" | "submitted" | "error"
}

export function Message({
  variant,
  id,
  isLast,
  onDelete,
  onEdit,
  onReload,
  hasScrollAnchor,
  parts,
  status,
}: MessageProps) {
  const [copied, setCopied] = useState(false)

  const textParts = parts?.filter((part) => part.type === "text")
  const textPartsAsText = textParts?.map((part) => part.text).join("")

  const copyToClipboard = () => {
    if (!textPartsAsText) {
      return
    }
    navigator.clipboard.writeText(textPartsAsText)
    setCopied(true)
    setTimeout(() => setCopied(false), 500)
  }

  if (variant === "user") {
    if (!parts) {
      // should not happen
      console.log("no parts")
      return null
    }
    return (
      <MessageUser
        parts={parts}
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        onEdit={onEdit}
        onDelete={onDelete}
        id={id}
        hasScrollAnchor={hasScrollAnchor}
      />
    )
  }

  if (variant === "assistant") {
    return (
      <MessageAssistant
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        isLast={isLast}
        hasScrollAnchor={hasScrollAnchor}
        parts={parts}
        status={status}
      />
    )
  }

  return null
}
