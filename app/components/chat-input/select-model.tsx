import { ModelSelector } from "@/components/common/model-selector"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CaretDown } from "@phosphor-icons/react"
import { MODELS_OPTIONS, PROVIDERS_OPTIONS } from "../../../lib/config"
import { PopoverContentAuth } from "./popover-content-auth"

export type SelectModelProps = {
  selectedModel: string
  onSelectModel: (model: string) => void
  isUserAuthenticated: boolean
}

export function SelectModel({
  selectedModel,
  onSelectModel,
  isUserAuthenticated,
}: SelectModelProps) {
  const model = MODELS_OPTIONS.find((model) => model.id === selectedModel)
  const provider = PROVIDERS_OPTIONS.find(
    (provider) => provider.id === model?.provider
  )

  if (!isUserAuthenticated) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="border-border dark:bg-secondary text-accent-foreground h-9 w-auto rounded-full border bg-transparent"
                type="button"
              >
                {provider?.icon && <provider.icon className="size-5" />}
                {model?.name}
                <CaretDown className="size-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Select a model</TooltipContent>
        </Tooltip>
        <PopoverContentAuth />
      </Popover>
    )
  }

  return (
    <ModelSelector
      selectedModelId={selectedModel}
      setSelectedModelId={onSelectModel}
      className="rounded-full"
    />
  )
}
