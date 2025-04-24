"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MODELS_FREE, MODELS_OPTIONS, MODELS_PRO } from "@/lib/config"
import { cn } from "@/lib/utils"
import { CaretDown, Image } from "@phosphor-icons/react"

type ModelSelectorProps = {
  selectedModelId: string
  setSelectedModelId: (modelId: string) => void
  className?: string
}

export function ModelSelector({
  selectedModelId,
  setSelectedModelId,
  className,
}: ModelSelectorProps) {
  const currentModel = MODELS_OPTIONS.find(
    (model) => model.id === selectedModelId
  )

  const renderModelItem = (model: any) => {
    const hasFileUpload = model.features?.find(
      (feature: any) => feature.id === "file-upload"
    )?.enabled

    return (
      <DropdownMenuItem
        key={model.id}
        className={cn(
          "flex items-center justify-between px-3 py-2",
          // !model.available && "cursor-not-allowed opacity-50",
          selectedModelId === model.id && "bg-accent"
        )}
        // disabled={!model.available}
        onClick={() => setSelectedModelId(model.id)}
      >
        <div className="flex items-center gap-3">
          {model?.icon && <model.icon className="size-5" />}
          <div className="flex flex-col gap-0">
            <span className="text-sm">{model.name}</span>
            <span className="text-muted-foreground line-clamp-2 text-xs">
              {model.description}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasFileUpload && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help rounded-full bg-blue-100 p-1 text-blue-600 dark:bg-blue-900">
                  <Image className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>This model can process and understand images.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </DropdownMenuItem>
    )
  }

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "dark:bg-secondary justify-between",
              // !currentModel?.available && "cursor-not-allowed opacity-50",
              className
            )}
          >
            <div className="flex items-center gap-2">
              {currentModel?.icon && <currentModel.icon className="size-5" />}
              <span>{currentModel?.name}</span>
            </div>
            <CaretDown className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="flex max-h-[400px] w-[400px] flex-col space-y-0.5 overflow-y-auto"
          align="start"
          sideOffset={4}
        >
          <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">
            Free Models
          </div>
          {MODELS_FREE.map(renderModelItem)}

          <div className="text-muted-foreground flex items-center justify-between px-2 py-1.5 text-sm font-medium">
            <span>Pro Models</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              5 free per day
            </span>
          </div>
          {MODELS_PRO.map(renderModelItem)}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
