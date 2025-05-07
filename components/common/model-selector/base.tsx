"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Model } from "@/lib/config"
import { MODELS_FREE, MODELS_OPTIONS, MODELS_PRO } from "@/lib/config"
import { cn } from "@/lib/utils"
import { CaretDown, MagnifyingGlass, Star } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ProModelDialog } from "./pro-dialog"
import { SubMenu } from "./sub-menu"

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
  const isMobile = useBreakpoint(768)

  const [hoveredModel, setHoveredModel] = useState<string | null>(null)
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isProDialogOpen, setIsProDialogOpen] = useState(false)
  const [selectedProModel, setSelectedProModel] = useState<string | null>(null)
  // Use ref instead of state for portal element
  const portalRef = useRef<HTMLElement | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Ref for input to maintain focus
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Setup portal element on mount
  useEffect(() => {
    portalRef.current = document.body

    return () => {
      // Force cleanup on unmount
      setHoveredModel(null)
    }
  }, [])

  // Find dropdown content and track its position
  useEffect(() => {
    const updateDropdownRect = () => {
      const dropdownEl = document.querySelector(
        "[data-radix-popper-content-wrapper]"
      )
      if (dropdownEl) {
        setDropdownRect(dropdownEl.getBoundingClientRect())
      }
    }

    if (hoveredModel && isDropdownOpen) {
      updateDropdownRect()

      // Add listener for window resize to update position
      window.addEventListener("resize", updateDropdownRect)
      return () => {
        window.removeEventListener("resize", updateDropdownRect)
      }
    }
  }, [hoveredModel, isDropdownOpen])

  // Close submenu when dropdown closes
  useEffect(() => {
    if (!isDropdownOpen) {
      setHoveredModel(null)
    }
  }, [isDropdownOpen])

  // Add this effect after the existing useEffect hooks
  // This will show the submenu for the current model when the dropdown opens
  useEffect(() => {
    if (isDropdownOpen && selectedModelId) {
      // Small delay to ensure dropdown is rendered
      const timer = setTimeout(() => {
        setHoveredModel(selectedModelId)

        // Update rectangle position
        const dropdownEl = document.querySelector(
          "[data-radix-popper-content-wrapper]"
        )
        if (dropdownEl) {
          setDropdownRect(dropdownEl.getBoundingClientRect())
        }
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [isDropdownOpen, selectedModelId])

  const renderModelItem = (model: Model) => {
    const isPro = MODELS_PRO.some((proModel) => proModel.id === model.id)

    return (
      <div
        key={model.id}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2",
          selectedModelId === model.id && "bg-accent"
        )}
        onClick={() => {
          if (isPro) {
            setSelectedProModel(model.id)
            setIsProDialogOpen(true)
            return
          }

          setSelectedModelId(model.id)
          if (isMobile) {
            setIsDrawerOpen(false)
          } else {
            setIsDropdownOpen(false)
          }
        }}
      >
        <div className="flex items-center gap-3">
          {model?.icon && <model.icon className="size-5" />}
          <div className="flex flex-col gap-0">
            <span className="text-sm">{model.name}</span>
          </div>
        </div>
        {isPro && (
          <div className="border-input bg-accent text-muted-foreground flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
            <Star className="size-2" />
            <span>Pro</span>
          </div>
        )}
      </div>
    )
  }

  // Get the hovered model data
  const hoveredModelData = MODELS_OPTIONS.find(
    (model) => model.id === hoveredModel
  )

  const models = [...MODELS_FREE, ...MODELS_PRO] as Model[]
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const trigger = (
    <Button
      variant="outline"
      className={cn("dark:bg-secondary justify-between", className)}
    >
      <div className="flex items-center gap-2">
        {currentModel?.icon && <currentModel.icon className="size-5" />}
        <span>{currentModel?.name}</span>
      </div>
      <CaretDown className="size-4 opacity-50" />
    </Button>
  )

  // Handle input change without losing focus
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setSearchQuery(e.target.value)
  }

  if (isMobile) {
    return (
      <>
        <ProModelDialog
          isOpen={isProDialogOpen}
          setIsOpen={setIsProDialogOpen}
          currentModel={selectedProModel || ""}
        />
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Select Model</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-2">
              <div className="relative">
                <MagnifyingGlass className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search models..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="flex h-full flex-col space-y-0.5 overflow-y-auto px-4 pb-6">
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => renderModelItem(model))
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <p className="text-muted-foreground mb-2 text-sm">
                    No results found.
                  </p>
                  <a
                    href="https://github.com/ibelick/zola/issues/new?title=Model%20Request%3A%20"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground text-sm underline"
                  >
                    Request a new model
                  </a>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <div>
      <ProModelDialog
        isOpen={isProDialogOpen}
        setIsOpen={setIsProDialogOpen}
        currentModel={selectedProModel || ""}
      />
      <DropdownMenu
        open={isDropdownOpen}
        onOpenChange={(open) => {
          setIsDropdownOpen(open)
          if (!open) {
            setHoveredModel(null)
            setSearchQuery("")
          }
        }}
      >
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          className="flex h-[320px] w-[300px] flex-col space-y-0.5 overflow-y-auto px-0 pt-0"
          align="start"
          sideOffset={4}
          forceMount
          side="top"
        >
          <div className="bg-background sticky top-0 z-10 border-b px-0 pt-0 pb-0">
            <div className="relative">
              <MagnifyingGlass className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Search models..."
                className="border border-none pl-8 shadow-none focus-visible:ring-0"
                value={searchQuery}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="flex h-full flex-col space-y-0.5 overflow-y-auto px-1 pt-1 pb-0">
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => {
                const isPro = MODELS_PRO.some(
                  (proModel) => proModel.id === model.id
                )

                return (
                  <DropdownMenuItem
                    key={model.id}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2",
                      selectedModelId === model.id && "bg-accent"
                    )}
                    onSelect={(e) => {
                      if (isPro) {
                        setSelectedProModel(model.id)
                        setIsProDialogOpen(true)
                        return
                      }

                      setSelectedModelId(model.id)
                      setIsDropdownOpen(false)
                    }}
                    onFocus={() => {
                      if (isDropdownOpen) {
                        setHoveredModel(model.id)
                      }
                    }}
                    onMouseEnter={() => {
                      if (isDropdownOpen) {
                        setHoveredModel(model.id)
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {model?.icon && <model.icon className="size-5" />}
                      <div className="flex flex-col gap-0">
                        <span className="text-sm">{model.name}</span>
                      </div>
                    </div>
                    {isPro && (
                      <div className="border-input bg-accent text-muted-foreground flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
                        <Star className="size-2" />
                        <span>Pro</span>
                      </div>
                    )}
                  </DropdownMenuItem>
                )
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <p className="text-muted-foreground mb-1 text-sm">
                  No results found.
                </p>
                <a
                  href="https://github.com/ibelick/zola/issues/new?title=Model%20Request%3A%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground text-sm underline"
                >
                  Request a new model
                </a>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {portalRef.current &&
        hoveredModel &&
        hoveredModelData &&
        dropdownRect &&
        isDropdownOpen &&
        createPortal(
          <SubMenu
            hoveredModelData={hoveredModelData}
            dropdownRect={dropdownRect}
          />,
          portalRef.current
        )}
    </div>
  )
}
