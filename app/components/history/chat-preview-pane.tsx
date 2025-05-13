"use client";

import { memo, useState, useEffect } from "react";
import type { Chats } from "@/lib/chat-store/types";
import { Message as MessageAISDK } from "@ai-sdk/react";
import { getCachedMessages, fetchAndCacheMessages, cacheMessages } from "@/lib/chat-store/messages/api"; // Added fetchAndCacheMessages and cacheMessages
import { Loader2 } from "lucide-react";
import { Chat, ChatCenteredText } from "@phosphor-icons/react";
import { Message } from "@/app/components/chat/message";

export type ChatPreviewPaneProps = {
  selectedChat: Chats | null;
  activeChatId: string | null;
  currentChatMessagesForActive: MessageAISDK[];
  searchTerm?: string;
};

type LoadingState = 'idle' | 'quick' | 'fetching';

export const ChatPreviewPane = memo(function ChatPreviewPane({
  selectedChat,
  activeChatId,
  currentChatMessagesForActive,
  searchTerm,
}: ChatPreviewPaneProps) {
  const [previewMessages, setPreviewMessages] = useState<MessageAISDK[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  useEffect(() => {
    if (!selectedChat) {
      setPreviewMessages([]);
      setLoadingState('idle');
      return;
    }

    let isMounted = true;
    // const minLoadingTimePromise = new Promise(resolve => setTimeout(resolve, 50)); // Keep or adjust as needed

    async function loadMessages() {
      setPreviewMessages([]); // Clear previous messages
      setLoadingState('quick'); // Initial quick load state

      if (selectedChat?.id === activeChatId) {
        // await minLoadingTimePromise;
        if (isMounted) {
          setPreviewMessages(currentChatMessagesForActive || []);
          setLoadingState('idle');
        }
        return;
      }

      try {
        const cachedMsgs = await getCachedMessages(selectedChat!.id);
        // await minLoadingTimePromise;

        if (isMounted) {
          if (cachedMsgs && cachedMsgs.length > 0) {
            setPreviewMessages(cachedMsgs);
            setLoadingState('idle');
          } else {
            // No messages in cache, or cache is empty, proceed to fetch
            setLoadingState('fetching');
            const fetchedMsgs = await fetchAndCacheMessages(selectedChat!.id);
            if (isMounted) {
              if (fetchedMsgs && fetchedMsgs.length > 0) {
                setPreviewMessages(fetchedMsgs);
                await cacheMessages(selectedChat!.id, fetchedMsgs); // Cache the fetched messages
              } else {
                setPreviewMessages([]); // No messages found even after fetch
              }
              setLoadingState('idle');
            }
          }
        }
      } catch (error) {
        console.error("Error loading messages for preview:", error);
        if (isMounted) {
          setPreviewMessages([]);
          setLoadingState('idle');
        }
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedChat, activeChatId, currentChatMessagesForActive]);

  if (loadingState === 'quick' || loadingState === 'fetching') {
    return (
      <div className="flex flex-1 flex-col min-h-0 items-center justify-center text-muted-foreground p-4 text-center py-6">
        <Loader2 className="animate-spin size-8 mb-3 opacity-75" />
        <span className="text-base font-medium">Loading Messages...</span>
        {/* Simplified subtext, or remove if not desired */}
        <span className="text-sm">Please wait a moment.</span> 
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
