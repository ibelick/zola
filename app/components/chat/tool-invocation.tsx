"use client"

import { Badge } from "@/components/ui/badge"
import { ChevronDown, Code, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
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
  data: ToolInvocation
  compact?: boolean
  defaultOpen?: boolean
}

export function ToolInvocationViewer({
  data,
  compact = false,
  defaultOpen = false,
}: ToolInvocationViewerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const toggleOpen = () => setIsOpen(!isOpen)

  // Get the tool invocation data
  const { toolInvocation } = data
  const { state, toolName, toolCallId, args, result } = toolInvocation
  const isRequested = state === "requested"
  const isCompleted = state === "result"

  // Parse the result JSON if available
  useEffect(() => {
    if (isCompleted && result?.content) {
      try {
        const content = result.content
        const textContent = content.find((item) => item.type === "text")

        if (textContent && textContent.text) {
          const parsed = JSON.parse(textContent.text)
          setParsedResult(parsed)
          setParseError(null)
        }
      } catch (error) {
        setParseError("Failed to parse result JSON")
        console.error("Failed to parse result JSON:", error)
      }
    }
  }, [isCompleted, result])

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
    <div
      className={`my-2 overflow-hidden rounded-md border bg-slate-50 text-sm ${compact ? "max-w-md" : "w-full"}`}
    >
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center">
          <Badge
            variant="outline"
            className={`mr-2 ${
              isRequested
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {isRequested ? (
              <div className="flex items-center">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Running
              </div>
            ) : (
              "Completed"
            )}
          </Badge>
          <div className="font-medium">{toolName}</div>
        </div>

        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={toggleOpen}
          className="cursor-pointer rounded-full p-1 hover:bg-slate-200"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t px-3 py-2">
              {/* Arguments section */}
              {args && Object.keys(args).length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 text-xs font-medium text-slate-500">
                    Arguments
                  </div>
                  <div className="rounded border bg-white p-2 text-xs">
                    {formattedArgs}
                  </div>
                </div>
              )}

              {/* Result section */}
              {isCompleted && (
                <div className="mb-3">
                  <div className="mb-1 text-xs font-medium text-slate-500">
                    Result
                  </div>
                  <div className="max-h-60 overflow-auto rounded border bg-white p-2 text-xs">
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
                              className="text-blue-600 hover:underline"
                            >
                              {parsedResult.html_url}
                            </a>
                          </div>
                        )}
                        <div className="mt-2 font-mono">
                          <pre className="text-xs whitespace-pre-wrap">
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
              <div className="text-xs text-slate-500">
                <Code className="mr-1 inline h-3 w-3" />
                Tool Call ID: {toolCallId}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
