"use client";

import React, { memo } from "react";
import type { Chats } from "@/lib/chat-store/types";
import { type TimeGroup } from "./utils"; // Import TimeGroup
import { CommandEmpty, CommandGroup, CommandList } from "@/components/ui/command";
import { HistoryItemContainer } from "./history-item-container";
import { Chat } from "@phosphor-icons/react";

export type HistoryListAreaProps = {
  filteredChat: Chats[]; // Used when searchQuery is active
  groupedChats: TimeGroup[] | null; // Used when no searchQuery
  searchQuery: string;
  showPreview: boolean; // To determine layout for CommandEmpty

  // Props to pass down to HistoryItemContainer
  onItemHover: (id: string) => void;
  onItemSelect: (id: string) => void;
  onSaveEditPersistence: (id: string, newTitle: string) => Promise<void>;
  onConfirmDeletePersistence: (id: string) => Promise<void>;
  activeEditingId: string | null;
  activeDeletingId: string | null;
  setActiveEditingId: (id: string | null) => void;
  setActiveDeletingId: (id: string | null) => void;
  globalEditTitle: string;
  setGlobalEditTitle: (title: string) => void;
};

export const HistoryListArea = memo(function HistoryListArea({
  filteredChat,
  groupedChats,
  searchQuery,
  showPreview,
  onItemHover,
  onItemSelect,
  onSaveEditPersistence,
  onConfirmDeletePersistence,
  activeEditingId,
  activeDeletingId,
  setActiveEditingId,
  setActiveDeletingId,
  globalEditTitle,
  setGlobalEditTitle,
}: HistoryListAreaProps) {

  if (searchQuery) {
    if (filteredChat.length === 0 && !showPreview) {
      return (
        <CommandList className="flex-grow min-h-0 !max-h-none overflow-y-scroll command-history-scrollbar-target flex flex-col justify-center items-center">
          <CommandEmpty className="!p-0 flex flex-col items-center text-muted-foreground">
            <Chat className="size-10 mb-3 opacity-75" />
            <span className="text-base font-medium">No Results Found</span>
            <span className="text-sm mt-1">Try a different search term.</span>
          </CommandEmpty>
        </CommandList>
      );
    }
    return (
      <CommandList className="flex-grow min-h-0 !max-h-none overflow-y-scroll command-history-scrollbar-target">
        <CommandGroup className="p-1.5">
          {filteredChat.map((chat) => (
            <HistoryItemContainer
              key={chat.id}
              chat={chat}
              onItemHover={onItemHover}
              onItemSelect={onItemSelect}
              onSaveEditPersistence={onSaveEditPersistence}
              onConfirmDeletePersistence={onConfirmDeletePersistence}
              activeEditingId={activeEditingId}
              activeDeletingId={activeDeletingId}
              setActiveEditingId={setActiveEditingId}
              setActiveDeletingId={setActiveDeletingId}
              globalEditTitle={globalEditTitle}
              setGlobalEditTitle={setGlobalEditTitle}
            />
          ))}
        </CommandGroup>
      </CommandList>
    );
  }

  // Not searching, use groupedChats
  if ((!groupedChats || groupedChats.length === 0) && !showPreview) {
     return (
        <CommandList className="flex-grow min-h-0 !max-h-none overflow-y-scroll command-history-scrollbar-target flex flex-col justify-center items-center">
          <CommandEmpty className="!p-0 flex flex-col items-center text-muted-foreground">
            <Chat className="size-10 mb-3 opacity-75" />
            <span className="text-base font-medium">No Chat History Found</span>
            <span className="text-sm mt-1">Your chat conversations will appear here.</span>
          </CommandEmpty>
        </CommandList>
      );
  }
  
  return (
    <CommandList className="flex-grow min-h-0 !max-h-none overflow-y-scroll command-history-scrollbar-target">
      {groupedChats?.map((group: TimeGroup) => (
        <CommandGroup
          key={group.name}
          heading={group.name}
          className="space-y-0 px-1.5"
        >
          {group.chats.map((chat: Chats) => (
            <HistoryItemContainer
              key={chat.id}
              chat={chat}
              onItemHover={onItemHover}
              onItemSelect={onItemSelect}
              onSaveEditPersistence={onSaveEditPersistence}
              onConfirmDeletePersistence={onConfirmDeletePersistence}
              activeEditingId={activeEditingId}
              activeDeletingId={activeDeletingId}
              setActiveEditingId={setActiveEditingId}
              setActiveDeletingId={setActiveDeletingId}
              globalEditTitle={globalEditTitle}
              setGlobalEditTitle={setGlobalEditTitle}
            />
          ))}
        </CommandGroup>
      ))}
    </CommandList>
  );
});

HistoryListArea.displayName = "HistoryListArea";
