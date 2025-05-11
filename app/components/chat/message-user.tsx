"use client"

import {
  MessageAction,
  MessageActions,
  Message as MessageContainer,
  MessageContent,
} from "@/components/prompt-kit/message"
import { cn } from "@/lib/utils"
import type { Message as MessageType } from "@ai-sdk/react"
import { Check, Copy, PencilSimple, Trash } from "@phosphor-icons/react"
import Image from "next/image"
import { useRef, useState } from "react"

import './scrollbar.css'

const getTextFromDataUrl = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1]
  return base64
}

export type MessageUserProps = {
  hasScrollAnchor?: boolean
  attachments?: MessageType["experimental_attachments"]
  children: string
  copied: boolean
  copyToClipboard: () => void
  onEdit: (id: string, newText: string) => void
  onReload: () => void
  onDelete: (id: string) => void
  id: string
}

export function MessageUser({
  hasScrollAnchor,
  attachments,
  children,
  copied,
  copyToClipboard,
  onEdit,
  onReload,
  onDelete,
  id,
}: MessageUserProps) {
   const [editInput, setEditInput] = useState(children)
  const [isEditing, setIsEditing] = useState(false)
 
  const contentRef = useRef<HTMLDivElement>(null)
 
  const [expandedImage, setExpandedImage] = useState<string | null>(null)




  const handleEditCancel = () => {
    setIsEditing(false)
    setEditInput(children)
  }

  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editInput)
    }
    onReload()
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(id)
  }
  

  return (
    <MessageContainer
      className={cn(
        "group flex w-full max-w-3xl flex-col items-end gap-2 px-6 pb-2",
        hasScrollAnchor && "min-h-scroll-anchor",
      )}
    >
      {attachments?.map((attachment, index) => (
        <div className="flex flex-row gap-2" key={`${attachment.name}-${index}`}>
          {attachment.contentType?.startsWith("image") ? (
            <div className="relative">
              <Image
                className="mb-1 w-40 rounded-md cursor-pointer"
                key={attachment.name}
                src={attachment.url || "/placeholder.svg"}
                alt={attachment.name || "Attachment"}
                onClick={() => setExpandedImage(attachment.url)}
              />
            </div>
          ) : attachment.contentType?.startsWith("text") ? (
            <div className="text-primary mb-3 h-24 w-40 overflow-hidden rounded-md border p-2 text-xs">
              {getTextFromDataUrl(attachment.url)}
            </div>
          ) : null}
        </div>
      ))}

      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={expandedImage || "/placeholder.svg"}
              alt="Expanded image"
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2"
              onClick={() => setExpandedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div
          className="flex flex-col w-full max-w-3xl mx-auto bg-gray-100 rounded-lg p-4"
          // style={{
          //   width: contentRef.current?.offsetWidth,
          // }}
        >
           <div className="relative min-h-16">

                <textarea
                className="w-full bg-transparent resize-none outline-none text-black placeholder-gray-500 py-2  max-h-64 scrollable "
                value={editInput}
                        onChange={(e) => {
                  setEditInput(e.target.value)
                  const el = e.target
                  el.style.height = "auto"
                  el.style.height = `${Math.min(el.scrollHeight, 26 * 24)}px`
                }}
                rows={1}
                style={{
                    lineHeight: "1.5rem",
                    maxHeight: `${1.5 * 26}rem`, // 26 rows
                    overflowY: "auto",
                    scrollbarWidth: "none", // Hide scrollbar in Firefox
                    msOverflowStyle: "none", // Hide scrollbar in IE/Edge
                  }}
                            onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSave()
                  }
                  if (e.key === "Escape") {
                    handleEditCancel()
                  }
                }}
                autoFocus
              />
           </div>
         
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleEditCancel}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-black dark:bg-white text-white dark:text-black rounded-full px-4 py-1 text-sm font-medium"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <MessageContent
          className="bg-accent relative max-w-[70%] rounded-3xl px-5 py-2.5"
          markdown={false}
          ref={contentRef}
        >
          {children}
        </MessageContent>
      )}
      <MessageActions className="flex gap-0 opacity-0 transition-opacity group-hover:opacity-100 bg-token-main-surface-tertiary rounded-3xl px-3 py-3">
        <MessageAction tooltip={copied ? "Copied!" : "Copy text"} side="bottom" delayDuration={0}>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
            aria-label="Copy text"
            onClick={copyToClipboard}
            type="button"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </MessageAction>
        <MessageAction tooltip={isEditing ? "Save" : "Edit"} side="bottom" delayDuration={0}>
          <button
            className="flex h-8 w-13 items-center justify-center rounded-full bg-transparent transition"
            aria-label="Edit"
            onClick={() => setIsEditing(!isEditing)}
            type="button"
          >
            <PencilSimple className="size-4" />
          </button>
        </MessageAction>
        <MessageAction tooltip="Delete" side="bottom" delayDuration={0}>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
            aria-label="Delete"
            onClick={handleDelete}
            type="button"
          >
            <Trash className="size-4" />
          </button>
        </MessageAction>
      </MessageActions>
    </MessageContainer>
  )
}
