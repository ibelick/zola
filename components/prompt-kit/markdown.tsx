"use client"

import { LinkMarkdown } from "@/app/components/chat/link-markdown"
import { cn } from "@/lib/utils"
import { marked } from "marked"
import { memo, useId, useMemo, useRef, useState, useEffect, RefObject } from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkBreaks from "remark-breaks"
import rehypeKatex from "rehype-katex"
import rehypeHighlight from "rehype-highlight"
import mermaid from "mermaid"
import { ButtonCopy } from "../common/button-copy"
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "./code-block"
import clsx from "clsx"
import "katex/dist/katex.min.css"
import { useDebouncedCallback } from "use-debounce"
import "highlight.js/styles/github.css"
export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
  loading?: boolean
  fontSize?: number
  fontFamily?: string
  parentRef?: RefObject<HTMLDivElement>
  defaultShow?: boolean
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>
  onDoubleClickCapture?: React.MouseEventHandler<HTMLDivElement>
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw)
}

function extractLanguage(className?: string): string {
  if (!className) return "plaintext"
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : "plaintext"
}

function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true)
          console.error("[Mermaid] ", e.message)
        })
    }
  }, [code])

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg")
    if (!svg) return
    const text = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([text], { type: "image/svg+xml" })
    window.open(URL.createObjectURL(blob), "_blank")
  }

  if (hasError) {
    return null
  }

  return (
    <div
      className={clsx("no-dark", "mermaid")}
      style={{
        cursor: "pointer",
        overflow: "auto",
      }}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
    >
      {code}
    </div>
  )
}

function PreCode(props: React.ComponentPropsWithRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null)
  const [mermaidCode, setMermaidCode] = useState("")
  const [htmlCode, setHtmlCode] = useState("")

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return
    const mermaidDom = ref.current.querySelector("code.language-mermaid")
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText)
    }
    const htmlDom = ref.current.querySelector("code.language-html")
    const refText = ref.current.querySelector("code")?.innerText
    if (htmlDom) {
      setHtmlCode((htmlDom as HTMLElement).innerText)
    } else if (
      refText?.startsWith("<!DOCTYPE") ||
      refText?.startsWith("<svg") ||
      refText?.startsWith("<?xml")
    ) {
      setHtmlCode(refText)
    }
  }, 600)

  //Wrap the paragraph for plain-text
  useEffect(() => {
    if (ref.current) {
      const codeElements = ref.current.querySelectorAll(
        "code",
      ) as NodeListOf<HTMLElement>
      const wrapLanguages = [
        "",
        "md",
        "markdown",
        "text",
        "txt",
        "plaintext",
        "tex",
        "latex",
      ]
      codeElements.forEach((codeElement) => {
        let languageClass = codeElement.className.match(/language-(\w+)/)
        let name = languageClass ? languageClass[1] : ""
        if (wrapLanguages.includes(name)) {
          codeElement.style.whiteSpace = "pre-wrap"
        }
      })
      setTimeout(renderArtifacts, 1)
    }
  }, [renderArtifacts])

  return (
    <>
      <pre ref={ref}>
        <span
          className="copy-code-button"
          onClick={() => {
            if (ref.current) {
              navigator.clipboard.writeText(
                ref.current.querySelector("code")?.innerText ?? ""
              )
            }
          }}
        ></span>
        {props.children}
      </pre>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
    </>
  )
}

function CustomCode(props: React.ComponentPropsWithRef<'code'> & { children?: any }) {
  const ref = useRef<HTMLPreElement>(null)
  const [collapsed, setCollapsed] = useState(true)
  const [showToggle, setShowToggle] = useState(false)
  const enableCodeFold = true // Configurable as needed

  useEffect(() => {
    if (ref.current) {
      const codeHeight = ref.current.scrollHeight
      setShowToggle(codeHeight > 400)
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [props.children])

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed)
  }
  
  const renderShowMoreButton = () => {
    if (showToggle && enableCodeFold && collapsed) {
      return (
        <div
          className={clsx("show-hide-button", {
            collapsed,
            expanded: !collapsed,
          })}
        >
          <button onClick={toggleCollapsed}>Show More</button>
        </div>
      )
    }
    return null
  }
  
  return (
    <>
      <code
        className={clsx(props?.className)}
        ref={ref}
        style={{
          maxHeight: enableCodeFold && collapsed ? "400px" : "none",
          overflowY: "hidden",
        }}
      >
        {props.children}
      </code>

      {renderShowMoreButton()}
    </>
  )
}

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock
      } else if (squareBracket) {
        return `$$${squareBracket}$$`
      } else if (roundBracket) {
        return `$${roundBracket}$`
      }
      return match
    },
  )
}

function tryWrapHtmlCode(text: string) {
  // try add wrap html code (fixed: html codeblock include 2 newline)
  // ignore embed codeblock
  if (text.includes("```")) {
    return text
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match
      },
    )
}

const INITIAL_COMPONENTS: Partial<Components> = {
  pre: PreCode,
  code: CustomCode,
  p: (pProps) => <p {...pProps} dir="auto" />,
  a: function AComponent({ href, children, ...props }) {
    if (!href) return <span {...props}>{children}</span>

    if (href && /\.(aac|mp3|opus|wav)$/.test(href)) {
      return (
        <figure>
          <audio controls src={href}></audio>
        </figure>
      )
    }
    
    if (href && /\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
      return (
        <video controls width="99.9%">
          <source src={href} />
        </video>
      )
    }
    
    const isInternal = /^\/#/i.test(href || "")
    const target = isInternal ? "_self" : props.target ?? "_blank"
    
    return (
      <LinkMarkdown href={href} {...props} target={target}>
        {children}
      </LinkMarkdown>
    )
  }
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string
    components?: Partial<Components>
  }) {
    const escapedContent = useMemo(() => {
      return tryWrapHtmlCode(escapeBrackets(content))
    }, [content])

    return (
      <ReactMarkdown 
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeKatex,
          [
            rehypeHighlight,
            {
              detect: false,
              ignoreMissing: true,
            },
          ],
        ]}
        components={components}
      >
        {escapedContent}
      </ReactMarkdown>
    )
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content
  }
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
  loading = false,
  fontSize = 14,
  fontFamily,
  parentRef,
  onContextMenu,
  onDoubleClickCapture,
}: MarkdownProps) {
  const generatedId = useId()
  const blockId = id ?? generatedId
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children])
  const mdRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn("markdown-body", className)}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily || "inherit",
      }}
      ref={mdRef}
      onContextMenu={onContextMenu}
      onDoubleClickCapture={onDoubleClickCapture}
      dir="auto"
    >
      {loading ? (
        <div className="loading-icon">Loading...</div>
      ) : (
        blocks.map((block, index) => (
          <MemoizedMarkdownBlock
            key={`${blockId}-block-${index}`}
            content={block}
            components={components}
          />
        ))
      )}
    </div>
  )
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = "Markdown"

export { Markdown, Mermaid }