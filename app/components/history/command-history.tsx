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
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Chats } from "@/lib/chat-store/types"
import { cn } from "@/lib/utils"
import { Check, PencilSimple, TrashSimple, X, Chat, ChatCenteredText, ArrowsInSimple, ArrowsOutSimple } from "@phosphor-icons/react"
import { useParams, useRouter } from "next/navigation"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatDate, groupChatsByDate } from "./utils"
import { Message as MessageAISDK } from "@ai-sdk/react";
import { Message } from "@/app/components/chat/message";
import { Loader2 } from "lucide-react"; // For loading state
import { getCachedMessages } from "@/lib/chat-store/messages/api"; // Import for fetching cached messages
import { CommandItemEdit, CommandItemEditProps } from "./command-item-edit"; // Added import
import { CommandItemDelete, CommandItemDeleteProps } from "./command-item-delete"; // Added import
import { CommandItemRow, CommandItemRowProps } from "./command-item-row"; // Added import
import { ChatPreviewPane, ChatPreviewPaneProps } from "./chat-preview-pane"; // Added import

type CommandHistoryProps = {
  chatHistory: Chats[]
  currentChatMessages: MessageAISDK[] // For active chat, passed to ChatPreviewPane
  activeChatId: string | null // For active chat ID
  onSaveEdit: (id: string, newTitle: string) => Promise<void>
  onConfirmDelete: (id: string) => Promise<void>
  trigger: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function CommandHistory({
  chatHistory,
  currentChatMessages,
  activeChatId,
  onSaveEdit,
  onConfirmDelete,
  trigger,
  isOpen,
  setIsOpen,
}: CommandHistoryProps) {
  const router = useRouter()
  const params = useParams()
  useChatSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState<string>("")
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true); // Default to true

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setEditingId(null)
      setDeletingId(null)
      setSelectedChatId(null); // Clear selection on close
      setSearchQuery(""); // Reset search query on close
    }
  }, [setIsOpen]);

  const handleEdit = useCallback((chat: Chats) => {
    setEditingId(chat.id)
    setEditTitle(chat.title || "")
    setDeletingId(null) // Ensure delete mode is reset
  }, [setEditTitle])

  const handleSaveEdit = useCallback(
    async (id: string) => {
      setEditingId(null)
      await onSaveEdit(id, editTitle)
    },
    [editTitle, onSaveEdit]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditTitle("")
  }, [setEditTitle])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
    setEditingId(null) // Ensure edit mode is reset
    setEditTitle("")    // Clear any lingering edit title
  }, [setEditTitle])

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      setDeletingId(null)
      await onConfirmDelete(id)
    },
    [onConfirmDelete]
  )

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null)
  }, [])

  const filteredChat = useMemo(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      return chatHistory.filter((chat) => {
        const titleMatch = chat.title ? chat.title.toLowerCase().includes(lowercasedQuery) : false;
        const idMatch = chat.id.toLowerCase().includes(lowercasedQuery);
        return titleMatch || idMatch;
      })
    } else {
      return chatHistory;
    }
  }, [chatHistory, searchQuery]);

  const groupedChats = useMemo(() => groupChatsByDate(filteredChat, searchQuery), [filteredChat, searchQuery]);

  // Determine the chat to preview (hovered or selected)
  const selectedChatForPreview = useMemo(() => {
    const idToUse = selectedChatId || hoveredChatId;
    if (!idToUse) return null;

    if (Array.isArray(groupedChats)) { // Check if groupedChats is an array
      for (const group of groupedChats) {
        // Ensure group exists and group.chats is an array before trying to find
        if (group && Array.isArray(group.chats)) { 
          const chat = group.chats.find(c => c.id === idToUse);
          if (chat) return chat;
        }
      }
    }
    return null;
  }, [selectedChatId, hoveredChatId, groupedChats]);

  useEffect(() => {
    if (selectedChatId) {
      const isSelectedChatVisible = groupedChats?.some(group => // Added optional chaining
        group.chats.some(chat => chat.id === selectedChatId)
      ) ?? false; // Ensure boolean
      if (!isSelectedChatVisible) {
        setSelectedChatId(null); 
      }
    }
    if (hoveredChatId) {
        const isHoveredChatVisible = groupedChats?.some(group => // Added optional chaining
            group.chats.some(chat => chat.id === hoveredChatId)
        ) ?? false; // Ensure boolean
        if (!isHoveredChatVisible) {
            setHoveredChatId(null);
        }
    }
  }, [groupedChats, selectedChatId, hoveredChatId]);

  const isSearchResultEmptyInPreview = useMemo(() => {
    return showPreview && searchQuery.length > 0 && filteredChat.length === 0;
  }, [showPreview, searchQuery, filteredChat]);

  const renderChatItem = useCallback(
    (chat: Chats) => {
      const isItemBeingEdited = editingId === chat.id;
      const isItemBeingDeleted = deletingId === chat.id;

      const commandItemRowProps = {
        chat,
        onEdit: handleEdit,
        onDelete: handleDelete,
        editingId,
        deletingId,
      };

      return (
        <CommandItem
          key={chat.id}
          onMouseEnter={() => {
            if (!editingId && !deletingId && selectedChatId !== chat.id) {
              setSelectedChatId(chat.id);
            }
          }}
          onSelect={() => {
            if (!editingId && !deletingId) {
              router.push(`/c/${chat.id}`);
              setIsOpen(false);
            }
          }}
          className={cn(
            "group data-[selected=true]:bg-accent flex w-full items-center justify-between rounded-md cursor-pointer",
            (isItemBeingEdited || isItemBeingDeleted) ? "!py-2 bg-accent data-[selected=true]:bg-accent" : "py-2"
          )}
          value={chat.id}
          data-value-id={chat.id}
        >
          {isItemBeingEdited ? (
            <CommandItemEdit chat={chat} editTitle={editTitle} setEditTitle={setEditTitle} onSave={handleSaveEdit} onCancel={handleCancelEdit} />
          ) : isItemBeingDeleted ? (
            <CommandItemDelete chat={chat} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
          ) : (
            <CommandItemRow {...commandItemRowProps} />
          )}
        </CommandItem>
      );
    },
    [
      editingId,
      deletingId,
      selectedChatId,
      editTitle,
      handleEdit,
      handleDelete,
      handleSaveEdit,
      handleCancelEdit,
      handleConfirmDelete,
      handleCancelDelete,
      router,
      setIsOpen,
      setEditTitle,
      setSelectedChatId
    ]
  );

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  const dialogBaseClasses = "flex flex-col transition-all duration-300 ease-in-out overflow-hidden";
  const widthClassesWithPreview = "w-[85vw] max-w-[1200px] lg:max-w-6xl";
  const widthClassesWithoutPreview = "w-[30vw] !max-w-[900px]";

  return (
    <>
      {/* Tooltip for the trigger button that opens the command history dialog */}
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>History</TooltipContent>
      </Tooltip>

      {/* CommandDialog: Main container for the entire chat history interface. 
          - Styling: Controlled by 'dialogContentClassName' and 'className'. 
          - Behavior: 'open' and 'onOpenChange' manage its visibility. 
          - 'title' and 'description' are for accessibility and headers (if not overridden).
          - 'hasCloseButton={false}' means we rely on other mechanisms or 'onOpenChange' for closing.
          - 'commandProps={{ shouldFilter: false }}' disables CommandDialog's built-in filtering, as we use a custom 'CommandInput' and filtering logic.
          - To change overall dialog size/shape: Modify 'dialogContentClassName' with Tailwind classes for width, height, max-width, etc.
            Example: `cn(dialogBaseClasses, showPreview ? widthClassesWithPreview : widthClassesWithoutPreview, showPreview ? "min-h-[85vh]" : "h-[50vh]")` dynamically changes width and height.
      */}
      <CommandDialog
        open={isOpen}
        onOpenChange={handleOpenChange}
        title="Chat History"
        description="Search through your past conversations"
        dialogContentClassName={cn(
          dialogBaseClasses, 
          showPreview ? widthClassesWithPreview : widthClassesWithoutPreview, 
          showPreview ? "min-h-[85vh]" : "h-[50vh]"
        )}
        className="flex h-full flex-col overflow-hidden" // Ensures dialog itself uses flex and handles overflow.
        hasCloseButton={false}
        commandProps={{ shouldFilter: false }}
      >
        {/* CommandInput: Search bar for filtering chat history.
            - Styling: 'className="flex-shrink-0"' prevents it from shrinking.
            - To change look: Modify Tailwind classes here for padding, background, text style, etc.
        */}
        <CommandInput
          placeholder="Search history..."
          value={searchQuery}
          onValueChange={(value) => setSearchQuery(value)}
          className="flex-shrink-0"
        />

        {/* Main Content Area: This div establishes the two-panel layout (list and preview).
            - Styling: 'flex-grow flex items-stretch min-w-0 overflow-hidden'.
              - 'flex-grow': Allows this area to expand and fill available vertical space within the dialog.
              - 'flex': Establishes a flex container for the left and right panels (defaults to row direction).
              - 'items-stretch': Ensures that the left and right panels stretch to fill the height of this container.
              - 'min-w-0': Essential for nested flex items that might overflow, preventing them from expanding their parent.
              - 'overflow-hidden': Clips content that exceeds the bounds, works with 'min-w-0'.
            - To change overall layout: Modify 'flex' (e.g., to 'flex-col' for vertical stacking of panels).
        */}
        <div className="flex-grow flex items-stretch min-w-0 overflow-hidden">
          {/* Left Panel (Chat List Container):
              - Styling: 'flex flex-col min-h-0 min-w-0 overflow-hidden transition-all duration-300 ease-in-out'.
                - 'flex flex-col': Children (CommandList) stack vertically.
                - 'min-w-0': Crucial for proper flexbox sizing within a container, allows shrinking.
                - 'overflow-hidden': Parent handles overflow, actual scroll is on CommandList.
                - 'transition-all...': For smooth animation when the preview pane is toggled.
                - Dynamic basis: Adjust left panel visibility and size based on search results in preview mode.
              - To change width ratio: Adjust 'basis-1/3'.
          */}
          <div
            className={cn(
              "flex flex-col min-h-0 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
              isSearchResultEmptyInPreview 
                ? "basis-0 opacity-0 p-0 pointer-events-none" 
                : (showPreview ? "basis-1/3 border-r" : "basis-full border-none")
            )}
          > 
            {/* CommandList is responsible for listing chat items or showing an empty state. 
                - Base styling: 'flex-grow min-h-0 !max-h-none overflow-y-scroll command-history-scrollbar-target' ensures it grows and scrolls.
                - Conditional styling (when empty & no preview): Adds flex properties to center the CommandEmpty component itself.
            */}
            <CommandList 
              className={cn(
                "flex-grow min-h-0 !max-h-none overflow-y-scroll command-history-scrollbar-target",
                (filteredChat.length === 0 && !showPreview) && "flex flex-col justify-center items-center" // Added conditional centering
              )}
            > 
              {/* Show CommandEmpty only if NOT in preview mode and list is empty */}
              {filteredChat.length === 0 && !showPreview && (
                <CommandEmpty className="!p-0 flex flex-col items-center text-muted-foreground">
                  <Chat className="size-10 mb-3 opacity-75" />
                  <span className="text-base font-medium">No Chat History Found</span>
                  <span className="text-sm mt-1">
                    Your chat conversations will appear here.
                  </span>
                </CommandEmpty>
              )}

              {/* Conditional rendering: If searchQuery exists, show a flat list. Otherwise, show grouped by date. */}
              {searchQuery ? (
                <CommandGroup className="p-1.5"> {/* Padding for the group when searching */}
                  {filteredChat.map((chat) => renderChatItem(chat))}
                </CommandGroup>
              ) : (
                groupedChats?.map((group) => (
                  <CommandGroup
                    key={group.name}
                    heading={group.name} // Date group heading
                    className="space-y-0 px-1.5" // Padding for the group and items
                  >
                    {group.chats.map((chat) => renderChatItem(chat))}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </div>

          {/* Right Panel (Chat Preview Container):
              - Styling: 'flex flex-col min-h-0 min-w-0 overflow-hidden transition-all duration-300 ease-in-out'.
                - Similar to left panel for flex behavior and transitions.
                - Dynamic visibility/sizing: Adjust right panel visibility and size based on search results in preview mode.
              - To change width ratio: Adjust 'basis-2/3'.
          */}
          <div
            className={cn(
              "flex flex-col min-h-0 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
              isSearchResultEmptyInPreview 
                ? "basis-full opacity-100 pl-0" // Take full width, ensure padding is appropriate
                : (showPreview
                  ? "basis-2/3 opacity-100 pl-4"
                  : "basis-0 opacity-0 p-0 pointer-events-none")
            )}
          >
            {/* ChatPreviewPane: Component responsible for showing messages of the selected/hovered chat.
                - Styling of the content WITHIN this pane is handled by the ChatPreviewPane component itself.
            */}
            <ChatPreviewPane 
              selectedChat={selectedChatForPreview} 
              activeChatId={activeChatId} 
              currentChatMessagesForActive={currentChatMessages} 
              searchTerm={searchQuery}
            />
          </div>
        </div>

        {/* Footer Section: Contains the toggle button for the preview pane.
            - Styling: 'flex-shrink-0 p-2 border-t flex items-center'.
              - 'flex-shrink-0': Prevents footer from shrinking.
              - 'p-2 border-t': Padding and top border for separation.
              - 'flex items-center': Aligns button vertically.
            - To change position/look: Modify these Tailwind classes.
        */}
        <div className="flex-shrink-0 p-2 border-t flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost" // Ghost button style
                size="icon"      // Icon button size
                onClick={togglePreview} // Action to show/hide preview
                className="text-muted-foreground hover:text-foreground cursor-pointer" // Text and hover colors, added cursor-pointer
              >
                {showPreview ? <ArrowsInSimple className="size-5" /> : <ArrowsOutSimple className="size-5" />} 
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{showPreview ? "Hide Preview Pane" : "Show Preview Pane"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CommandDialog>
    </>
  )
}
