"use client"

import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X } from "@phosphor-icons/react";
import type { Chats } from "@/lib/chat-store/types";

export type CommandItemDeleteProps = {
  chat: Chats;
  onConfirm: (id: string) => void;
  onCancel: () => void;
};

// Component for deleting a chat item
export const CommandItemDelete = memo(function CommandItemDelete({
  chat,
  onConfirm,
  onCancel,
}: CommandItemDeleteProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm(chat.id);
      }}
      className="flex w-full items-center justify-between"
    >
      <div className="flex flex-1 items-center">
        <span className="line-clamp-1 text-base font-normal">{chat.title}</span>
        <input
          type="text"
          className="sr-only hidden"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            } else if (e.key === "Enter") {
              e.preventDefault();
              onConfirm(chat.id);
            }
          }}
        />
      </div>
      <div className="ml-2 flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive-foreground size-8 hover:bg-gray-200 dark:hover:bg-accent"
              type="submit"
            >
              <Check className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground size-8 hover:bg-gray-200 dark:hover:bg-accent"
              onClick={onCancel}
              type="button"
            >
              <X className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
});
CommandItemDelete.displayName = 'CommandItemDelete';
