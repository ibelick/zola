"use client";

import { memo, useState, useEffect } from "react";
import type { Chats } from "@/lib/chat-store/types";
import { Message as MessageAISDK } from "@ai-sdk/react";
import { getCachedMessages } from "@/lib/chat-store/messages/api";
import { Loader2 } from "lucide-react";
import { Chat, ChatCenteredText } from "@phosphor-icons/react";
import { Message } from "@/app/components/chat/message";

export type ChatPreviewPaneProps = {
  selectedChat: Chats | null;
  activeChatId: string | null;
  currentChatMessagesForActive: MessageAISDK[];
  searchTerm?: string;
};

export const ChatPreviewPane = memo(function ChatPreviewPane({
  selectedChat,
  activeChatId,
  currentChatMessagesForActive,
  searchTerm,
}: ChatPreviewPaneProps) {
  const [previewMessages, setPreviewMessages] = useState<MessageAISDK[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedChat) {
      setPreviewMessages([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const minLoadingTimePromise = new Promise(resolve => setTimeout(resolve, 50));

    async function fetchMessages() {
      setIsLoading(true);

      if (selectedChat?.id === activeChatId) {
        await minLoadingTimePromise;
        if (isMounted) {
          setPreviewMessages(currentChatMessagesForActive || []);
          setIsLoading(false);
        }
        return;
      }

      try {
        const cachedMsgs = await getCachedMessages(selectedChat!.id);
        await minLoadingTimePromise;
        if (isMounted) {
          setPreviewMessages(cachedMsgs || []);
        }
      } catch (error) {
        console.error("Error fetching cached messages for preview:", error);
        if (isMounted) {
          setPreviewMessages([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedChat, activeChatId, currentChatMessagesForActive]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-h-0 items-center justify-center text-muted-foreground p-4 text-center py-6">
        <Loader2 className="animate-spin size-8 mb-3 opacity-75" />
        <span className="text-base font-medium">Loading Preview...</span>
        <span className="text-sm">Fetching conversation messages.</span>
      </div>
    );
  }

  if (!selectedChat) {
    return (
      <div className="flex flex-1 flex-col min-h-0 items-center justify-center text-muted-foreground p-4 text-center py-6">
        <Chat className="size-10 mb-3 opacity-75" />
        <span className="text-base font-medium">
          {searchTerm ? "No Matching Chats" : "No Chat Selected"}
        </span>
        <span className="text-sm">
          {searchTerm 
            ? "Clear or change your search to see other chats, or select one if available."
            : "Hover over a chat in the list to preview it here."}
        </span>
      </div>
    );
  }

  if (previewMessages.length === 0) {
    return (
      <div className="flex flex-1 flex-col min-h-0 items-center justify-center text-muted-foreground p-4 text-center py-6">
        <ChatCenteredText className="size-10 mb-3 opacity-75" />
        <span className="text-base font-medium">Chat is Empty</span>
        <span className="text-sm">This conversation has no messages to display.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full overflow-hidden">
      <div className="flex-grow overflow-y-scroll space-y-4 p-1 pr-2 command-history-scrollbar-target">
        {previewMessages.map((message, index) => (
          <div key={message.id || `preview-wrapper-${index}`} className="w-full overflow-hidden">
            <Message
              key={message.id || `preview-${index}`}
              id={message.id}
              variant={message.role}
              attachments={message.experimental_attachments}
              isLast={index === previewMessages.length - 1}
              onDelete={() => {}} // Preview is read-only
              onEdit={() => {}}   // Preview is read-only
              onReload={() => {}} // Preview is read-only
              parts={message.toolInvocations?.map(invocation => ({
                type: 'tool-invocation',
                toolInvocation: invocation
              }))}
            >
              {message.content}
            </Message>
          </div>
        ))}
      </div>
    </div>
  );
});
ChatPreviewPane.displayName = 'ChatPreviewPane';
