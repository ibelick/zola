import { addUTM } from "@/app/components/chat/utils"
import { ModelConfig } from "@/lib/models/types"
import { PROVIDERS } from "@/lib/providers"
import {
  ArrowSquareOutIcon,
  BrainIcon,
  ImageIcon,
  WrenchIcon,
} from "@phosphor-icons/react"

type SubMenuProps = {
  hoveredModelData: ModelConfig
}

export function SubMenu({ hoveredModelData }: SubMenuProps) {
  const provider = PROVIDERS.find(
    (provider) => provider.id === hoveredModelData.icon
  )

  return (
    <div className="bg-popover border-border w-[280px] rounded-md border p-3 shadow-md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {provider?.icon && <provider.icon className="size-5" />}
          <h3 className="font-medium">{hoveredModelData.name}</h3>
        </div>

        <p className="text-muted-foreground text-sm">
          {hoveredModelData.description}
        </p>

        <div className="flex flex-col gap-1">
          <div className="mt-1 flex flex-wrap gap-2">
            {hoveredModelData.vision && (
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-800 dark:text-green-100">
                <ImageIcon className="size-3" />
                <span>Vision</span>
              </div>
            )}

            {hoveredModelData.tools && (
              <div className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-800 dark:text-purple-100">
                <WrenchIcon className="size-3" />
                <span>Tools</span>
              </div>
            )}

            {hoveredModelData.reasoning && (
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-800 dark:text-amber-100">
                <BrainIcon className="size-3" />
                <span>Reasoning</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">Context</span>
            <span>
              {Intl.NumberFormat("fr-FR", {
                style: "decimal",
              }).format(hoveredModelData.contextWindow ?? 0)}{" "}
              tokens
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">Input Pricing</span>
              <span>
                {Intl.NumberFormat("ja-JP", {
                  style: "currency",
                  currency: "USD",
                }).format(hoveredModelData.inputCost ?? 0)}{" "}
                / 1M tokens
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">Output Pricing</span>
              <span>
                {Intl.NumberFormat("ja-JP", {
                  style: "currency",
                  currency: "USD",
                }).format(hoveredModelData.outputCost ?? 0)}{" "}
                / 1M tokens
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">Provider</span>
            <span>{hoveredModelData.provider}</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex-1 font-medium">Id</span>
            <span className="text-muted-foreground truncate text-xs">
              {String(hoveredModelData.id)}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 text-xs">
            <a
              href={addUTM(hoveredModelData.apiDocs ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5"
            >
              <span className="">API Docs</span>
              <ArrowSquareOutIcon className="size-3" />
            </a>
            <a
              href={addUTM(hoveredModelData.modelPage ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5"
            >
              <span className="">Model Page</span>
              <ArrowSquareOutIcon className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
