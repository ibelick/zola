"use client";

import React, { memo, useCallback, useEffect, useState } from "react";
import type { Chats } from "@/lib/chat-store/types";
import { CommandItem } from "@/components/ui/command";
import { CommandItemEdit } from "./command-item-edit";
import { CommandItemDelete } from "./command-item-delete";
import { CommandItemRow } from "./command-item-row";
import { cn } from "@/lib/utils";

export type HistoryItemContainerProps = {
  chat: Chats;
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

export const HistoryItemContainer = memo(function HistoryItemContainer({
  chat,
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
}: HistoryItemContainerProps) {
  const id = chat.id;
  const isEditing = activeEditingId === id;
  const isDeleting = activeDeletingId === id;

  const [title, setTitle] = useState(chat.title ?? "");

  /* Hold lokal tittel synkron med globalen når denne raden går i redigering */
  useEffect(() => {
    if (isEditing) setTitle(globalEditTitle || chat.title || "");
  }, [isEditing, globalEditTitle, chat.title]);

  /* Generelle hjelpere */
  const blockIfLocked = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      if (isEditing || isDeleting) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isEditing, isDeleting],
  );

  const startEdit = () => {
    setActiveEditingId(id);
    setGlobalEditTitle(chat.title ?? "");
    setActiveDeletingId(null);
  };

  const startDelete = () => {
    setActiveDeletingId(id);
    setActiveEditingId(null);
  };

  /* Persist-handlinger */
  const saveEdit = async () => {
    await onSaveEditPersistence(id, title);
    setActiveEditingId(null);
  };

  const confirmDelete = async () => {
    await onConfirmDeletePersistence(id);
    setActiveDeletingId(null);
  };

  return (
    <CommandItem
      value={id}
      data-value-id={id}
      onMouseEnter={() => onItemHover(id)}
      onSelect={() => !isEditing && !isDeleting && onItemSelect(id)}
      onPointerMove={blockIfLocked}
      onMouseDown={blockIfLocked}
      className={cn(
        "group flex w-full items-center justify-between rounded-md cursor-pointer data-[selected=true]:bg-accent",
        (isEditing || isDeleting) ? "!py-2 bg-accent" : "py-2",
      )}
    >
      {isEditing ? (
        <CommandItemEdit
          chat={chat}
          editTitle={title}
          setEditTitle={setTitle}
          onSave={saveEdit}
          onCancel={() => setActiveEditingId(null)}
        />
      ) : isDeleting ? (
        <CommandItemDelete
          chat={chat}
          onConfirm={confirmDelete}
          onCancel={() => setActiveDeletingId(null)}
        />
      ) : (
        <CommandItemRow
          chat={chat}
          onStartEdit={startEdit}
          onStartDelete={startDelete}
          editingId={activeEditingId}
          deletingId={activeDeletingId}
        />
      )}
    </CommandItem>
  );
});

HistoryItemContainer.displayName = "HistoryItemContainer";
