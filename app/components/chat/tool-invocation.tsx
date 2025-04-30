"use client"

import { cn } from "@/lib/utils"
import { Message as MessageType } from "@ai-sdk/react"
import type { ToolInvocationUIPart } from "@ai-sdk/ui-utils"
import { CaretDown } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { Code, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface ToolInvocationContent {
  text: string
  type: string
}

interface ToolInvocationResult {
  content: ToolInvocationContent[]
}

interface ToolInvocationData {
  args?: Record<string, any>
  step: number
  state: "requested" | "result"
  toolName: string
  toolCallId: string
  result?: ToolInvocationResult
}

interface ToolInvocation {
  type: "tool-invocation"
  toolInvocation: ToolInvocationData
}

interface ToolInvocationViewerProps {
  data: ToolInvocationUIPart
  defaultOpen?: boolean
}

const TRANSITION = {
  type: "spring",
  duration: 0.2,
  bounce: 0,
}

export function ToolInvocation({
  data,
  defaultOpen = false,
}: ToolInvocationViewerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen)

  const [parsedResult, setParsedResult] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Get the tool invocation data
  const { toolInvocation } = data
  const { state, toolName, toolCallId, args } = toolInvocation
  const isRequested = state === "partial-call" || state === "call"
  const isCompleted = state === "result"

  // Parse the result JSON if available
  useEffect(() => {
    if (isCompleted && "result" in toolInvocation) {
      try {
        // For ToolResult, the result property contains the result directly
        const resultData = toolInvocation.result
        if (typeof resultData === "string") {
          try {
            const parsed = JSON.parse(resultData)
            setParsedResult(parsed)
            setParseError(null)
          } catch (e) {
            // If it's not JSON, just use the string directly
            setParsedResult(resultData)
            setParseError(null)
          }
        } else {
          // If it's already an object, use it directly
          setParsedResult(resultData)
          setParseError(null)
        }
      } catch (error) {
        setParseError("Failed to parse result data")
        console.error("Failed to parse result data:", error)
      }
    }
  }, [isCompleted, toolInvocation])

  // Format the arguments for display
  const formattedArgs = args
    ? Object.entries(args).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="font-medium text-slate-600">{key}:</span>{" "}
          {typeof value === "object"
            ? value === null
              ? "null"
              : Array.isArray(value)
                ? value.length === 0
                  ? "[]"
                  : JSON.stringify(value)
                : JSON.stringify(value)
            : String(value)}
        </div>
      ))
    : null

  return (
    <div className="w-full">
      <div className="border-border flex flex-col gap-0 overflow-hidden rounded-md border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="hover:bg-accent flex w-full flex-row items-center rounded-t-md px-3 py-2 transition-colors"
        >
          <div className="flex flex-1 flex-row items-center gap-2 text-left text-base">
            <span className="text-sm font-medium">{toolName}</span>
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
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
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
                      ) : parsedResult ? (
                        <div>
                          {parsedResult.title && (
                            <div className="mb-2 font-medium">
                              {parsedResult.title}
                            </div>
                          )}
                          {parsedResult.html_url && (
                            <div className="mb-2">
                              <a
                                href={parsedResult.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary flex items-center gap-1 hover:underline"
                              >
                                <span>{parsedResult.html_url}</span>
                                <Code className="h-3 w-3 opacity-70" />
                              </a>
                            </div>
                          )}
                          <div className="font-mono text-xs">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(parsedResult, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        "No result data available"
                      )}
                    </div>
                  </div>
                )}

                {/* Tool call ID */}
                <div className="text-muted-foreground flex items-center text-xs">
                  <Code className="mr-1 inline h-3 w-3" />
                  Tool Call ID: {toolCallId}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
