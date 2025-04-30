"use client"

import { cn } from "@/lib/utils"
import type {
  ToolInvocation as BaseToolInvocation,
  ToolInvocationUIPart,
} from "@ai-sdk/ui-utils"
import { CaretDown, Code, Link, Nut, Spinner } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

type CustomToolInvocation =
  | BaseToolInvocation
  | ({
      state: "requested"
      step?: number
      toolCallId: string
      toolName: string
      args?: any
    } & {
      result?: any
    })

type CustomToolInvocationUIPart = Omit<
  ToolInvocationUIPart,
  "toolInvocation"
> & {
  toolInvocation: CustomToolInvocation
}

interface ToolInvocationProps {
  data: CustomToolInvocationUIPart | CustomToolInvocationUIPart[]
  className?: string
  defaultOpen?: boolean
}

function hasResult(
  toolInvocation: CustomToolInvocation
): toolInvocation is CustomToolInvocation & { result: any } {
  return (
    toolInvocation.state === "result" ||
    (toolInvocation as any).result !== undefined
  )
}

const TRANSITION = {
  type: "spring",
  duration: 0.2,
  bounce: 0,
}

export function ToolInvocation({
  data,
  defaultOpen = false,
}: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen)

  const toolInvocations = Array.isArray(data) ? data : [data]

  const uniqueToolIds = new Set(
    toolInvocations.map((item) => item.toolInvocation.toolCallId)
  )
  const isSingleTool = uniqueToolIds.size === 1

  if (isSingleTool) {
    return (
      <SingleToolView
        data={toolInvocations}
        defaultOpen={defaultOpen}
        className="mb-10"
      />
    )
  }

  return (
    <div className="mb-10">
      <div className="border-border flex flex-col gap-0 overflow-hidden rounded-md border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="hover:bg-accent flex w-full flex-row items-center rounded-t-md px-3 py-2 transition-colors"
        >
          <div className="flex flex-1 flex-row items-center gap-2 text-left text-base">
            <Nut className="text-muted-foreground size-4" />
            <span className="text-sm">Tools executed</span>
            <div className="bg-secondary rounded-full px-1.5 py-0.5 font-mono text-xs text-slate-700">
              {uniqueToolIds.size}
            </div>
          </div>
          <CaretDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180 transform" : ""
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={TRANSITION}
              className="overflow-hidden"
            >
              <div className="px-3 pt-3 pb-3">
                <div className="space-y-4">
                  {/* Group tools by toolCallId */}
                  {Array.from(uniqueToolIds).map((toolId) => {
                    const requestTool = toolInvocations.find(
                      (item) =>
                        item.toolInvocation.toolCallId === toolId &&
                        (item.toolInvocation as CustomToolInvocation).state ===
                          "requested"
                    )

                    const resultTool = toolInvocations.find(
                      (item) =>
                        item.toolInvocation.toolCallId === toolId &&
                        item.toolInvocation.state === "result"
                    )

                    // Show the result tool if available, otherwise show the request
                    const toolToShow = resultTool || requestTool

                    if (!toolToShow) return null

                    return (
                      <div
                        key={toolId}
                        className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <SingleToolView data={[toolToShow]} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SingleToolView({
  data,
  defaultOpen = false,
  className,
}: {
  data: CustomToolInvocationUIPart[]
  defaultOpen?: boolean
  className?: string
}) {
  const resultTool = data.find((item) => item.toolInvocation.state === "result")
  const requestTool = data.find(
    (item) =>
      (item.toolInvocation as CustomToolInvocation).state === "requested"
  )
  const toolData = resultTool || requestTool

  if (!toolData) return null

  const [isExpanded, setIsExpanded] = useState(defaultOpen)
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const { toolInvocation } = toolData
  const { state, toolName, toolCallId, args } =
    toolInvocation as CustomToolInvocation
  const isRequested = state === "requested"
  const isCompleted = state === "result"
  const result = hasResult(toolInvocation) ? toolInvocation.result : undefined

  // Parse the result JSON if available
  useEffect(() => {
    let didCancel = false

    if (isCompleted && result) {
      // Handle array results (like search results)
      if (Array.isArray(result)) {
        if (!didCancel) {
          setParsedResult(result)
        }
        return
      }

      // Handle object results with content property
      if (
        typeof result === "object" &&
        result !== null &&
        "content" in result
      ) {
        try {
          const content = result.content
          const textContent = content.find(
            (item: { type: string }) => item.type === "text"
          )

          if (textContent && textContent.text) {
            try {
              // Try to parse as JSON first
              const parsed = JSON.parse(textContent.text)
              if (!didCancel) {
                setParsedResult(parsed)
              }
            } catch (e) {
              // If not valid JSON, just use the text as is
              if (!didCancel) {
                setParsedResult(textContent.text)
              }
            }
            if (!didCancel) {
              setParseError(null)
            }
          }
        } catch (error) {
          if (!didCancel) {
            setParseError("Failed to parse result")
          }
          console.error("Failed to parse result:", error)
        }
      }
    }

    return () => {
      didCancel = true
    }
  }, [isCompleted, result])

  // Format the arguments for display
  const formattedArgs = args
    ? Object.entries(args).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="font-medium text-slate-600">{key}:</span>{" "}
          <span className="font-mono">
            {typeof value === "object"
              ? value === null
                ? "null"
                : Array.isArray(value)
                  ? value.length === 0
                    ? "[]"
                    : JSON.stringify(value)
                  : JSON.stringify(value)
              : String(value)}
          </span>
        </div>
      ))
    : null

  // Render generic results based on their structure
  const renderResults = () => {
    if (!parsedResult) return "No result data available"

    // Handle array of items with url, title, and snippet (like search results)
    if (Array.isArray(parsedResult) && parsedResult.length > 0) {
      // Check if items look like search results
      if (
        parsedResult[0] &&
        typeof parsedResult[0] === "object" &&
        "url" in parsedResult[0] &&
        "title" in parsedResult[0]
      ) {
        return (
          <div className="space-y-3">
            {parsedResult.map((item: any, index: number) => (
              <div
                key={index}
                className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary group flex items-center gap-1 font-medium hover:underline"
                >
                  {item.title}
                  <Link className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
                </a>
                <div className="text-muted-foreground mt-1 font-mono text-xs">
                  {item.url}
                </div>
                {item.snippet && (
                  <div className="mt-1 line-clamp-2 text-sm">
                    {item.snippet}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      // Generic array display
      return (
        <div className="font-mono text-xs">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(parsedResult, null, 2)}
          </pre>
        </div>
      )
    }

    // Handle object results
    if (typeof parsedResult === "object" && parsedResult !== null) {
      return (
        <div>
          {parsedResult.title && (
            <div className="mb-2 font-medium">{parsedResult.title}</div>
          )}
          {parsedResult.html_url && (
            <div className="mb-2">
              <a
                href={parsedResult.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 hover:underline"
              >
                <span className="font-mono">{parsedResult.html_url}</span>
                <Link className="h-3 w-3 opacity-70" />
              </a>
            </div>
          )}
          <div className="font-mono text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(parsedResult, null, 2)}
            </pre>
          </div>
        </div>
      )
    }

    // Handle string results
    if (typeof parsedResult === "string") {
      return <div className="whitespace-pre-wrap">{parsedResult}</div>
    }

    // Fallback
    return "No result data available"
  }

  return (
    <div
      className={cn(
        "border-border flex flex-col gap-0 overflow-hidden rounded-md border",
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
        className="hover:bg-accent flex w-full flex-row items-center rounded-t-md px-3 py-2 transition-colors"
      >
        <div className="flex flex-1 flex-row items-center gap-2 text-left text-base">
          <span className="font-mono text-sm">{toolName}</span>
          <div
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs",
              isRequested
                ? "border border-blue-200 bg-blue-50 text-blue-700"
                : "border border-green-200 bg-green-50 text-green-700"
            )}
          >
            {isRequested ? (
              <div className="flex items-center">
                <Spinner className="mr-1 h-3 w-3 animate-spin" />
                Running
              </div>
            ) : (
              "Completed"
            )}
          </div>
        </div>
        <CaretDown
          className={cn(
            "h-4 w-4 transition-transform",
            isExpanded ? "rotate-180 transform" : ""
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pt-3 pb-3">
              {/* Arguments section */}
              {args && Object.keys(args).length > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Arguments
                  </div>
                  <div className="rounded border bg-slate-50 p-2 text-sm">
                    {formattedArgs}
                  </div>
                </div>
              )}

              {/* Result section */}
              {isCompleted && (
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Result
                  </div>
                  <div className="max-h-60 overflow-auto rounded border bg-slate-50 p-2 text-sm">
                    {parseError ? (
                      <div className="text-red-500">{parseError}</div>
                    ) : (
                      renderResults()
                    )}
                  </div>
                </div>
              )}

              {/* Tool call ID */}
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <Code className="mr-1 inline h-3 w-3" />
                  Tool Call ID:{" "}
                  <span className="ml-1 font-mono">{toolCallId}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
