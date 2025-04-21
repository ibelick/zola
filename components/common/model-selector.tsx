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
import { MODELS_OPTIONS, PROVIDERS_OPTIONS } from "@/lib/config"
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
  const model = MODELS_OPTIONS.find((model) => model.id === selectedModelId)

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "dark:bg-secondary justify-between",
              !model?.available && "cursor-not-allowed opacity-50",
              className
            )}
          >
            <div className="flex items-center gap-2">
              {model?.icon && <model.icon className="size-5" />}
              <span>{model?.name}</span>
            </div>
            <CaretDown className="size-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="flex max-h-[400px] w-[400px] flex-col space-y-0.5 overflow-y-auto"
          align="start"
          sideOffset={4}
        >
          {/* Models Section */}
          <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">
            Available Models
          </div>

          {MODELS_OPTIONS.map((model) => {
            const provider = PROVIDERS_OPTIONS.find(
              (provider) => provider.id === model.provider
            )
            const hasFileUpload = model.features?.find(
              (feature) => feature.id === "file-upload"
            )?.enabled

            return (
              <DropdownMenuItem
                key={model.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2",
                  !model.available && "cursor-not-allowed opacity-50",
                  selectedModelId === model.id && "bg-accent"
                )}
                disabled={!model.available}
                onClick={() => model.available && setSelectedModelId(model.id)}
              >
                <div className="flex items-center gap-3">
                  {model?.icon && <model.icon className="size-5" />}
                  <div className="flex flex-col gap-0">
                    <span className="text-base">{model.name}</span>
                    <span className="text-muted-foreground text-xs">
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
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
