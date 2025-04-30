import { Message as MessageType } from "@ai-sdk/react"
import React, { useState } from "react"
import { MessageAssistant } from "./message-assistant"
import { MessageUser } from "./message-user"
import { ToolInvocation } from "./tool-invocation"

type MessageProps = {
  variant: MessageType["role"]
  children: string
  id: string
  attachments?: MessageType["experimental_attachments"]
  isLast?: boolean
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => void
  onReload: () => void
  hasScrollAnchor?: boolean
  parts?: MessageType["parts"]
}

export function Message({
  variant,
  children,
  id,
  attachments,
  isLast,
  onDelete,
  onEdit,
  onReload,
  hasScrollAnchor,
  parts,
}: MessageProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 500)
  }

  if (variant === "user") {
    return (
      <MessageUser
        children={children}
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        onEdit={onEdit}
        onDelete={onDelete}
        id={id}
        hasScrollAnchor={hasScrollAnchor}
        attachments={attachments}
      />
    )
  }

  if (variant === "assistant" && parts?.[0]?.type === "tool-invocation") {
    const toolInvocationParts = parts.filter(
      (part) => part.type === "tool-invocation"
    )

    console.log("toolInvocationParts", toolInvocationParts)

    return (
      <div className="group mb-16 flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-6 pb-2">
        {toolInvocationParts.map((toolInvocation, index) => (
          <div key={index} className="flex w-full flex-col gap-2">
            <ToolInvocation data={toolInvocation} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "assistant") {
    return (
      <MessageAssistant
        children={children}
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        isLast={isLast}
        hasScrollAnchor={hasScrollAnchor}
        parts={parts}
      />
    )
  }

  return null
}
