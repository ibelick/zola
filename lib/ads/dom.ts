import type { NativeTextInstruction } from "./types"

const SKIPPED_TAGS = new Set(["A", "CODE", "PRE", "SCRIPT", "STYLE"])

function hasSkippedAncestor(node: Text, container: Element): boolean {
  let parent = node.parentElement
  while (parent && parent !== container) {
    if (SKIPPED_TAGS.has(parent.tagName)) return true
    parent = parent.parentElement
  }
  return parent === container && SKIPPED_TAGS.has(container.tagName)
}

export function injectNativeTextAnchor(
  container: Element,
  instruction: NativeTextInstruction,
  reportClick: (url: string) => void = () => undefined
): boolean {
  const document = container.ownerDocument
  const existing = document.getElementById(instruction.anchor_dom_id)
  if (existing && container.contains(existing)) return true

  const walker = document.createTreeWalker(
    container,
    document.defaultView?.NodeFilter.SHOW_TEXT ?? 4
  )
  let node = walker.nextNode() as Text | null

  while (node) {
    const index = node.data
      .toLowerCase()
      .indexOf(instruction.keyword.toLowerCase())
    if (index !== -1 && !hasSkippedAncestor(node, container)) {
      const before = node.data.slice(0, index)
      const after = node.data.slice(index + instruction.keyword.length)
      const matchedText = node.data.slice(
        index,
        index + instruction.keyword.length
      )
      const anchor = document.createElement("a")
      anchor.id = instruction.anchor_dom_id
      anchor.href = instruction.landing_url
      anchor.target = "_blank"
      anchor.rel = "noopener noreferrer sponsored"
      anchor.textContent = matchedText
      anchor.dataset.adAnchor = "native-text"
      anchor.addEventListener("click", () =>
        reportClick(instruction.click_tracking_url)
      )
      anchor.className =
        "text-primary decoration-primary/50 hover:decoration-primary font-medium underline underline-offset-2"

      const fragment = document.createDocumentFragment()
      if (before) fragment.append(document.createTextNode(before))
      fragment.append(anchor)
      if (after) fragment.append(document.createTextNode(after))
      node.replaceWith(fragment)
      return true
    }
    node = walker.nextNode() as Text | null
  }

  return false
}
