"use client"

import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/prompt-kit/chat-container"
import { Loader } from "@/components/prompt-kit/loader"
import { ScrollButton } from "@/components/prompt-kit/scroll-button"
import { getModelInfo } from "@/lib/models"
import { PROVIDERS } from "@/lib/providers"
import { Message as MessageType } from "@ai-sdk/react"
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

interface MultiModelConversationProps {
  messageGroups: GroupedMessage[]
}

export function MultiModelConversation({
  messageGroups,
}: MultiModelConversationProps) {
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
          {messageGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground text-center">
                <h3 className="mb-2 text-lg font-semibold">Multi-Model Chat</h3>
                <p>
                  Send a message to compare responses from multiple AI models
                </p>
              </div>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
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

                <div className="mx-auto flex w-full max-w-[1800px] items-start space-x-4 overflow-x-auto px-6">
                  {group.responses.map((res) => {
                    const model = getModelInfo(res.model)

                    const providerIcon = PROVIDERS.find(
                      (p) => p.id === model?.baseProviderId
                    )

                    return (
                      <div
                        key={res.model}
                        className="max-w-[420px] min-w-[360px] flex-shrink-0 rounded border bg-transparent p-3"
                      >
                        <div className="text-muted-foreground mb-2 flex items-center gap-1">
                          <span>
                            {providerIcon?.icon && (
                              <providerIcon.icon className="size-4" />
                            )}
                          </span>
                          <span className="text-xs font-medium">
                            {model?.name}
                          </span>
                        </div>

                        {res.message ? (
                          <Message
                            id={res.message.id}
                            variant="assistant"
                            parts={
                              res.message.parts || [
                                { type: "text", text: res.message.content },
                              ]
                            }
                            attachments={res.message.experimental_attachments}
                            onDelete={() =>
                              group.onDelete(res.model, res.message.id)
                            }
                            onEdit={(id, newText) =>
                              group.onEdit(res.model, id, newText)
                            }
                            onReload={() => group.onReload(res.model)}
                            status={res.isLoading ? "streaming" : "ready"}
                            isLast={false}
                            hasScrollAnchor={false}
                            className="bg-transparent p-0 px-0"
                          >
                            {res.message.content}
                          </Message>
                        ) : res.isLoading ? (
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
                    )
                  })}
                </div>
              </div>
            ))
          )}
          <div className="absolute bottom-0 flex w-full max-w-3xl flex-1 items-end justify-end gap-4 px-6 pb-2">
            <ScrollButton className="absolute top-[-50px] right-[30px]" />
          </div>
        </ChatContainerContent>
      </ChatContainerRoot>
    </div>
  )
}
