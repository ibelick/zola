"use client";

import { memo, useCallback } from "react";
import type { Chats } from "@/lib/chat-store/types";
import { cn } from "@/lib/utils";
import { useChatSession } from "../../providers/chat-session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";
import { formatDate } from "./utils";

export type CommandItemRowProps = {
  chat: Chats;
  onStartEdit: (chat: Chats) => void;
  onStartDelete: (id: string) => void;
  editingId: string | null;
  deletingId: string | null;
};

export const CommandItemRow = memo(
  ({ chat, onStartEdit, onStartDelete, editingId, deletingId }: CommandItemRowProps) => {
    const { chatId } = useChatSession();
    const isCurrent = chat.id === chatId;
    const lockActive = Boolean(editingId || deletingId);

    /* Felles stopper for bubbling når rad-handlinger klikkes */
    const stop = (e: React.MouseEvent) => e.stopPropagation();

    const handleEdit = useCallback(
      (e: React.MouseEvent) => {
        stop(e);
        onStartEdit(chat);
      },
      [chat, onStartEdit],
    );

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        stop(e);
        onStartDelete(chat.id);
      },
      [chat.id, onStartDelete],
    );

    return (
      <>
        {/* Tittel + “current”-badge */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="line-clamp-1 text-base font-normal">
            {chat.title || "Untitled Chat"}
          </span>
          {isCurrent && <Badge variant="outline">current</Badge>}
        </div>

        {/* Dato / handlingsknapper */}
        <div className="relative flex min-w-[120px] flex-shrink-0 justify-end">
          <span
            className={cn(
              "text-muted-foreground text-sm font-normal transition-opacity",
              "group-data-[selected=true]:opacity-0",
              lockActive && "group-data-[selected=true]:opacity-100",
            )}
          >
            {formatDate(chat.created_at)}
          </span>

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-end gap-1 opacity-0 transition-opacity",
              "group-data-[selected=true]:opacity-100",
              lockActive && "group-data-[selected=true]:opacity-0",
            )}
          >
            <Button
              size="icon"
              variant="ghost"
              className="group/edit hover:bg-primary/10 size-8"
              onClick={handleEdit}
              aria-label="Edit"
              type="button"
            >
              <PencilSimple className="text-muted-foreground group-hover/edit:text-primary size-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="group/delete text-muted-foreground hover:text-destructive hover:bg-destructive-foreground/10 size-8"
              onClick={handleDelete}
              aria-label="Delete"
              type="button"
            >
              <TrashSimple className="text-muted-foreground group-hover/delete:text-destructive size-4" />
            </Button>
          </div>
        </div>
      </>
    );
  },
);

CommandItemRow.displayName = "CommandItemRow";
