"use client"

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X } from "@phosphor-icons/react";
import type { Chats } from "@/lib/chat-store/types";

export type CommandItemEditProps = {
  chat: Chats;
  editTitle: string;
  setEditTitle: (title: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
};

// Component for editing a chat item
export const CommandItemEdit = memo(function CommandItemEdit({
  chat,
  editTitle,
  setEditTitle,
  onSave,
  onCancel,
}: CommandItemEditProps) {
  return (
    <form
      className="flex w-full items-center justify-between"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(chat.id);
      }}
    >
      <Input
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        className="box-border flex-1 appearance-none bg-transparent dark:bg-transparent p-0 font-normal border-0 ring-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:ring-0"
        style={{ fontSize: '1rem', height: '1.5rem', lineHeight: '1.5rem', backgroundColor: 'transparent' }}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSave(chat.id);
          }
        }}
      />
      <div className="ml-2 flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground size-8 hover:bg-gray-200 dark:hover:bg-accent"
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
              type="button"
              onClick={onCancel}
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
CommandItemEdit.displayName = 'CommandItemEdit';
