"use client"

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";
import type { Chats } from "@/lib/chat-store/types";
import { formatDate } from "./utils";

export type CommandItemRowProps = {
  chat: Chats;
  onEdit: (chat: Chats) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  deletingId: string | null;
};

// Component for displaying a normal chat row
export const CommandItemRow = memo(function CommandItemRow({
  chat,
  onEdit,
  onDelete,
  editingId,
  deletingId,
}: CommandItemRowProps) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <span className="line-clamp-1 text-base font-normal">
          {chat?.title || "Untitled Chat"}
        </span>
      </div>

      {/* Date and actions container */}
      <div className="relative flex min-w-[120px] flex-shrink-0 justify-end">
        {/* Date that shows by default but hides on selection */}
        <span
          className={cn(
            "text-muted-foreground text-sm font-normal opacity-100 transition-opacity duration-0",
            "group-data-[selected=true]:opacity-0",
            Boolean(editingId || deletingId) &&
              "group-data-[selected=true]:opacity-100"
          )}
        >
          {formatDate(chat?.created_at)}
        </span>

        {/* Action buttons that appear on selection, positioned over the date */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-end gap-1 opacity-0 transition-opacity duration-0",
            "group-data-[selected=true]:opacity-100",
            Boolean(editingId || deletingId) &&
              "group-data-[selected=true]:opacity-0"
          )}
        >
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground size-8 hover:bg-gray-200 dark:hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              if (chat) onEdit(chat);
            }}
            type="button"
          >
            <PencilSimple className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive size-8 hover:bg-gray-200 dark:hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              if (chat?.id) onDelete(chat.id);
            }}
            type="button"
          >
            <TrashSimple className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
});
CommandItemRow.displayName = 'CommandItemRow';
