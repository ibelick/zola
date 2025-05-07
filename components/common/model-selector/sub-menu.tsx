import type { Model } from "@/lib/config"
import { Brain, Image } from "@phosphor-icons/react"
import { Wrench } from "lucide-react"

type SubMenuProps = {
  hoveredModelData: Model
}

export function SubMenu({ hoveredModelData }: SubMenuProps) {
  return (
    <div className="bg-popover w-[280px] rounded-md border p-3 shadow-md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {hoveredModelData?.icon && (
            <hoveredModelData.icon className="size-5" />
          )}
          <h3 className="font-medium">{hoveredModelData.name}</h3>
        </div>

        <p className="text-muted-foreground text-sm">
          {hoveredModelData.description}
        </p>

        <div className="flex flex-col gap-1">
          <div className="mt-1 flex flex-wrap gap-2">
            {hoveredModelData.features?.find((f: any) => f.id === "file-upload")
              ?.enabled && (
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-800 dark:text-green-100">
                <Image className="size-3" />
                <span>Vision</span>
              </div>
            )}

            {hoveredModelData.features?.find((f: any) => f.id === "tool-use")
              ?.enabled && (
              <div className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-800 dark:text-purple-100">
                <Wrench className="size-3" />
                <span>Tools</span>
              </div>
            )}

            {hoveredModelData.features?.find((f: any) => f.id === "reasoning")
              ?.enabled && (
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-800 dark:text-amber-100">
                <Brain className="size-3" />
                <span>Reasoning</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Provider</span>
            <span>{hoveredModelData.provider}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-sm font-medium">Id</span>
            <span className="text-muted-foreground text-xs">
              {String(hoveredModelData.id)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
