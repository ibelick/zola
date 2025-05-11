import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsThree, PencilSimple, Trash } from "@phosphor-icons/react"

type SidebarItemMenuProps = {
  chat: any
}

export function SidebarItemMenu({ chat }: SidebarItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hover:bg-secondary flex size-7 items-center justify-center rounded-md p-1 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsThree size={18} className="text-primary" weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="cursor-pointer">
          <PencilSimple size={16} className="mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive cursor-pointer"
          variant="destructive"
        >
          <Trash size={16} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
