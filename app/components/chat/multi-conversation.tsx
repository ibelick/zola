"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { Loader } from "@/components/prompt-kit/loader"
import { ScrollButton } from "@/components/prompt-kit/scroll-button"
import { getModelInfo } from "@/lib/models"
import { PROVIDERS } from "@/lib/providers"
import { cn } from "@/lib/utils"
import { Message as MessageType } from "@ai-sdk/react"
import { useEffect, useState } from "react"
import { Message } from "./message"

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

type MultiModelConversationProps = {
  messageGroups: GroupedMessage[]
}

type ResponseCardProps = {
  response: GroupedMessage["responses"][0]
  group: GroupedMessage
}

function ResponseCard({ response, group }: ResponseCardProps) {
  const model = getModelInfo(response.model)
  const providerIcon = PROVIDERS.find((p) => p.id === model?.baseProviderId)

  return (
    <div className="relative">
      <div className="bg-background pointer-events-auto relative rounded border p-3">
        {/* <button
          className="bg-background absolute top-2 right-2 z-30 cursor-grab p-1 active:cursor-grabbing"
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <DotsSixVerticalIcon className="text-muted-foreground size-4" />
        </button> */}

        <div className="text-muted-foreground mb-2 flex items-center gap-1">
          <span>
            {providerIcon?.icon && <providerIcon.icon className="size-4" />}
          </span>
          <span className="text-xs font-medium">{model?.name}</span>
        </div>

        {response.message ? (
          <Message
            id={response.message.id}
            variant="assistant"
            parts={
              response.message.parts || [
                { type: "text", text: response.message.content },
              ]
            }
            attachments={response.message.experimental_attachments}
            onDelete={() => group.onDelete(response.model, response.message.id)}
            onEdit={(id, newText) => group.onEdit(response.model, id, newText)}
            onReload={() => group.onReload(response.model)}
            status={response.isLoading ? "streaming" : "ready"}
            isLast={false}
            hasScrollAnchor={false}
            className="bg-transparent p-0 px-0"
          >
            {response.message.content}
          </Message>
        ) : response.isLoading ? (
          <div className="space-y-2">
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              assistant
            </div>
            <Loader />
          </div>
        ) : (
          <div className="text-muted-foreground text-sm italic">
            Waiting for response...
          </div>
        )}
      </div>
    </div>
  )
}

export function MultiModelConversation({
  messageGroups,
}: MultiModelConversationProps) {
  // State to manage the order of responses for each group
  const [groupResponses, setGroupResponses] = useState<
    Record<number, GroupedMessage["responses"]>
  >(() => {
    const initial: Record<number, GroupedMessage["responses"]> = {}
    messageGroups.forEach((group, index) => {
      initial[index] = [...group.responses]
    })
    return initial
  })

  // Update group responses when messageGroups changes
  useEffect(() => {
    const updated: Record<number, GroupedMessage["responses"]> = {}
    messageGroups.forEach((group, index) => {
      updated[index] = [...group.responses]
    })
    setGroupResponses(updated)
  }, [messageGroups])

  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-y-auto">
      <ChatContainerRoot className="relative w-full">
        <ChatContainerContent
          className="flex w-full flex-col items-center pt-20 pb-[134px]"
          style={{
            scrollbarGutter: "stable both-edges",
            scrollbarWidth: "none",
          }}
        >
          {messageGroups.length === 0
            ? null
            : messageGroups.map((group, groupIndex) => {
                return (
                  <div key={groupIndex} className="mb-10 w-full space-y-3">
                    <div className="mx-auto w-full max-w-3xl">
                      <Message
                        id={group.userMessage.id}
                        variant="user"
                        parts={
                          group.userMessage.parts || [
                            { type: "text", text: group.userMessage.content },
                          ]
                        }
                        attachments={group.userMessage.experimental_attachments}
                        onDelete={() => {}}
                        onEdit={() => {}}
                        onReload={() => {}}
                        status="ready"
                      >
                        {group.userMessage.content}
                      </Message>
                    </div>

                    <div
                      className={cn(
                        "mx-auto w-full",
                        groupResponses[groupIndex]?.length > 2
                          ? "max-w-[1800px]"
                          : "max-w-3xl"
                      )}
                    >
                      <div className={cn("overflow-x-auto pl-6")}>
                        <div className="flex gap-4">
                          {(groupResponses[groupIndex] || group.responses).map(
                            (response) => {
                              return (
                                <div
                                  key={response.model}
                                  className="max-w-[420px] min-w-[320px] flex-shrink-0"
                                >
                                  <ResponseCard
                                    response={response}
                                    group={group}
                                  />
                                </div>
                              )
                            }
                          )}
                          {/* Spacer to create scroll padding - only when more than 2 items */}
                          <div className="w-px flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          <div className="absolute right-0 bottom-32 flex w-full max-w-3xl flex-1 items-end justify-end gap-4 pb-2 pl-6">
            <ScrollButton className="absolute top-[-50px] right-[30px]" />
          </div>
        </ChatContainerContent>
      </ChatContainerRoot>
    </div>
  )
}
