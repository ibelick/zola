"use client"

import { useChatSession } from "@/app/providers/chat-session-provider"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
// Input import removed as it's unused in this file
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Chats } from "@/lib/chat-store/types"
import { cn } from "@/lib/utils"
import { Check, PencilSimple, TrashSimple, X, Chat, ChatCenteredText, ArrowsInSimple, ArrowsOutSimple } from "@phosphor-icons/react"
import { useRouter } from "next/navigation" // Removed useParams
import React, { memo, useCallback, useEffect, useMemo, useState } from "react" // Removed useRef
import { formatDate, groupChatsByDate } from "./utils"
import { Message as MessageAISDK } from "@ai-sdk/react";
import { ChatPreviewPane } from "./chat-preview-pane";
import { HistoryListArea } from "./history-list-area"; 

type PreviewToggleButtonProps = {
  showPreview: boolean;
  onToggle: () => void;
};

const PreviewToggleButton = memo(({ showPreview, onToggle }: PreviewToggleButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="text-muted-foreground hover:text-foreground h-5 w-5 p-0"
      >
        {showPreview ? (
          <ArrowsInSimple className="size-4" />
        ) : (
          <ArrowsOutSimple className="size-4" />
        )}
      </Button>
    </TooltipTrigger>

    <TooltipContent side="top">
      {showPreview ? "Hide Preview" : "Show Preview"}
    </TooltipContent>
  </Tooltip>
));

PreviewToggleButton.displayName = "PreviewToggleButton";
export default PreviewToggleButton;

// Memoized component for static keyboard hints in the footer
const KeyboardHintsFooter = React.memo(() => {
  // console.log("KeyboardHintsFooter render"); // For debugging
  return (
    <>
      <div className="flex flex-row items-center gap-1.5">
        <div className="flex flex-row items-center gap-0.5">
          <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
            ↑
          </span>
          <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
            ↓
          </span>
        </div>
        <span>Navigate</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
          ⏎
        </span>
        <span>Go to chat</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex flex-row items-center gap-0.5">
          <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
            ⌘
          </span>
          <span className="border-border bg-muted inline-flex size-5 items-center justify-center rounded-sm border">
            K
          </span>
        </div>
        <span>Toggle</span>
      </div>
    </>
  );
});
KeyboardHintsFooter.displayName = "KeyboardHintsFooter";

type CommandHistoryProps = {
  chatHistory: Chats[]
  currentChatMessages: MessageAISDK[]
  activeChatId: string | null
  onSaveEdit: (id: string, newTitle: string) => Promise<void>
  onConfirmDelete: (id: string) => Promise<void>
  trigger: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

// Old HistoryItem component and its props are removed as HistoryItemContainer replaces it.

export function CommandHistory({
  chatHistory,
  currentChatMessages,
  activeChatId,
  onSaveEdit: onSaveEditPersistence, // Rename prop for clarity when passing to container
  onConfirmDelete: onConfirmDeletePersistence, // Rename prop for clarity
  trigger,
  isOpen,
  setIsOpen,
}: CommandHistoryProps) {
  // const params = useParams() // Removed as params is unused
  useChatSession() // Call useChatSession if its context is needed by children, but don't destructure if not used directly

  const [searchQuery, setSearchQuery] = useState("")
  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, [setSearchQuery]); // setSearchQuery itself is stable

  // These states now represent the *globally* active item for edit/delete
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [activeDeletingId, setActiveDeletingId] = useState<string | null>(null);
  // This state is for the title of the *globally* active editing item
  const [globalEditTitle, setGlobalEditTitle] = useState<string>(""); 
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null); // Keep if used for other effects
  
  const [showPreview, setShowPreview] = useState(() => {
    // Initialize state from localStorage if available, otherwise default to true
    if (typeof window !== 'undefined') {
      const storedShowPreview = localStorage.getItem("commandHistoryShowPreview");
      if (storedShowPreview !== null) {
        try {
          return JSON.parse(storedShowPreview);
        } catch (e) {
          console.error("Error parsing commandHistoryShowPreview from localStorage", e);
          return true; // Default on parsing error
        }
      }
    }
    return true; // Default if localStorage is not available or item not found
  }); 
  const [isPreviewTransitioning, setIsPreviewTransitioning] = useState(false); // Added for hover delay

  const router = useRouter()

  // Effect to save showPreview state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("commandHistoryShowPreview", JSON.stringify(showPreview));
    }
  }, [showPreview]);

  // Stable event handlers
  const handleItemHover = useCallback((itemId: string) => {
    // Only change preview selection if no item is globally targeted for edit/delete and not transitioning
    if (!activeEditingId && !activeDeletingId && !isPreviewTransitioning) {
        setSelectedChatId(itemId);
    }
  }, [activeEditingId, activeDeletingId, setSelectedChatId, isPreviewTransitioning]);

  const handleItemSelect = useCallback((itemId: string) => {
    // Only allow selection if no item is globally targeted for edit/delete
    if (!activeEditingId && !activeDeletingId) {
        router.push(`/c/${itemId}`);
        setIsOpen(false);
    }
  }, [activeEditingId, activeDeletingId, router, setIsOpen]);


  // Add keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [isOpen, setIsOpen])

  // Prefetch chat pages
  useEffect(() => {
    if (!isOpen) return
    chatHistory.forEach((chat) => {
      router.prefetch(`/c/${chat.id}`)
    })
  }, [isOpen, chatHistory, router])

  // Dialog open/close handler
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setActiveEditingId(null); // Reset global active editing ID
      setActiveDeletingId(null); // Reset global active deleting ID
      setGlobalEditTitle("");    // Reset global edit title
      setSelectedChatId(null);
      setSearchQuery("");
    }
  }, [setIsOpen, setActiveEditingId, setActiveDeletingId, setGlobalEditTitle]);

  // The individual item start/save/cancel/confirm logic is now in HistoryItemContainer.
  // CommandHistory only needs to manage the global active IDs and pass down persistence callbacks.

  // Filtered chat list
  const filteredChat = useMemo(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      return chatHistory.filter((chat) => {
        const titleMatch = chat.title ? chat.title.toLowerCase().includes(lowercasedQuery) : false;
        const idMatch = chat.id.toLowerCase().includes(lowercasedQuery); // Assuming chat.id is a string
        return titleMatch || idMatch;
      })
    } else {
      return chatHistory;
    }
  }, [chatHistory, searchQuery]);

  const groupedChats = useMemo(() => groupChatsByDate(filteredChat, searchQuery), [filteredChat, searchQuery]);

  // Determine the chat to preview
  const selectedChatForPreview = useMemo(() => {
    if (isPreviewTransitioning) return null; // Do not show any preview during transition

    const idToUse = selectedChatId || hoveredChatId; // Prioritize selected, then hovered
    if (!idToUse) return null;
    // Find chat in groupedChats or filteredChat
    if (Array.isArray(groupedChats)) {
      for (const group of groupedChats) {
        if (group && Array.isArray(group.chats)) {
          const chat = group.chats.find(c => c.id === idToUse);
          if (chat) return chat;
        }
      }
    }
    return filteredChat.find(c => c.id === idToUse) || null;
  }, [selectedChatId, hoveredChatId, groupedChats, filteredChat, isPreviewTransitioning]); // Added isPreviewTransitioning
  
  // Effect to clear selection if item is no longer visible
  useEffect(() => {
    const isIdVisible = (id: string | null) => {
        if (!id) return false;
        return groupedChats?.some(group => group.chats.some(chat => chat.id === id)) ?? false;
    };

    if (selectedChatId && !isIdVisible(selectedChatId)) {
        setSelectedChatId(null);
    }
    if (hoveredChatId && !isIdVisible(hoveredChatId)) {
        setHoveredChatId(null);
    }
  }, [groupedChats, selectedChatId, hoveredChatId]);

  const isSearchResultEmptyInPreview = useMemo(() => {
    return showPreview && searchQuery.length > 0 && filteredChat.length === 0;
  }, [showPreview, searchQuery, filteredChat]);

  // Toggle preview pane
  const togglePreview = useCallback(() => {
    setIsPreviewTransitioning(true);
    setShowPreview((prev: boolean) => !prev);
    setTimeout(() => {
      setIsPreviewTransitioning(false);
    }, 300); // Match CSS transition duration
  }, []);

  const dialogBaseClasses = "flex flex-col transition-all duration-300 ease-in-out overflow-hidden";
  const widthClassesWithPreview = "w-[85vw] max-w-[1200px] lg:max-w-6xl";
  const widthClassesWithoutPreview = "w-[30vw] !max-w-[900px]"; // Original: w-[30vw] !max-w-[900px]

  const commandDialogProps = useMemo(() => ({
    shouldFilter: false,
  }), []);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>History</TooltipContent>
      </Tooltip>
      <CommandDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title="Chat History"
        description="Search through your past conversations"
        dialogContentClassName={cn(
          dialogBaseClasses,
          showPreview ? widthClassesWithPreview : widthClassesWithoutPreview,
          showPreview ? "min-h-[85vh]" : "h-[50vh]" // Adjusted height when no preview
        )}
        className="flex h-full flex-col overflow-hidden"
        hasCloseButton={false} // Assuming custom close or Esc
        commandProps={commandDialogProps} // Use memoized props
      >
        <CommandInput
          placeholder="Search history..."
          value={searchQuery}
          onValueChange={handleSearchQueryChange} // Use stable callback
          className="flex-shrink-0" // Prevent shrinking
        />
        <div className="flex-grow flex items-stretch min-w-0 overflow-hidden"> {/* Main content area */}
          <div /* Left Panel (Chat List) */
            className={cn(
              "flex flex-col min-h-0 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
              isSearchResultEmptyInPreview
                ? "basis-0 opacity-0 p-0 pointer-events-none" // Hide if search empty in preview
                : (showPreview ? "basis-1/3 border-r" : "basis-full border-none")
            )}
          >
            <HistoryListArea
              filteredChat={filteredChat}
              groupedChats={groupedChats}
              searchQuery={searchQuery}
              showPreview={showPreview}
              onItemHover={handleItemHover}
              onItemSelect={handleItemSelect}
              onSaveEditPersistence={onSaveEditPersistence}
              onConfirmDeletePersistence={onConfirmDeletePersistence}
              activeEditingId={activeEditingId}
              activeDeletingId={activeDeletingId}
              setActiveEditingId={setActiveEditingId}
              setActiveDeletingId={setActiveDeletingId}
              globalEditTitle={globalEditTitle}
              setGlobalEditTitle={setGlobalEditTitle}
            />
          </div>
          <div /* Right Panel (Chat Preview) */
            className={cn(
              "flex flex-col min-h-0 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
              isSearchResultEmptyInPreview
                ? "basis-full opacity-100 pl-0" // Full width if search empty in preview
                : (showPreview
                  ? "basis-2/3 opacity-100 pl-4" // Standard preview
                  : "basis-0 opacity-0 p-0 pointer-events-none") // Hidden if no preview
            )}
          >
            <ChatPreviewPane
              selectedChat={selectedChatForPreview}
              activeChatId={activeChatId} // Prop from parent
              currentChatMessagesForActive={currentChatMessages} // Prop from parent
              searchTerm={searchQuery}
            />
          </div>
        </div>
        {/* Footer / Indicator Bar */}
        <div className="bg-card border-input flex flex-shrink-0 items-center justify-between border-t px-4 py-3">
          <div className="text-muted-foreground flex w-full items-center gap-2 text-xs">
            <div className="flex w-full flex-row items-center justify-between gap-1">
              <div className="flex w-full flex-1 flex-row items-center gap-4">
                <PreviewToggleButton showPreview={showPreview} onToggle={togglePreview} />
                <KeyboardHintsFooter />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="border-border bg-muted inline-flex h-5 items-center justify-center rounded-sm border px-1">
                Esc
              </span>
              <span>Close</span>
            </div>
          </div>
        </div>
      </CommandDialog>
    </>
  )
}
