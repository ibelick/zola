import type { NativeTextInstruction } from "./types"

const SKIPPED_TAGS = new Set(["A", "CODE", "PRE", "SCRIPT", "STYLE"])
const PURCHASE_INTENT = [
  "购买",
  "下单",
  "价格",
  "优惠",
  "buy",
  "purchase",
  "price",
  "deal",
]
const RECOMMEND_INTENT = ["推荐", "值得", "首选", "recommend", "worth", "best"]
const BENEFIT_INTENT = ["适合", "帮助", "效果", "suitable", "help", "benefit"]
const NEGATIVE_INTENT = [
  "不推荐",
  "不适合",
  "避免",
  "风险",
  "注意",
  "not recommend",
  "avoid",
  "risk",
  "caution",
]

export type NativeTextPlacementOptions = {
  finalized?: boolean
  moveThreshold?: number
  reportClick?: (url: string) => void
}

export type NativeTextPlacementResult = {
  placed: boolean
  moved: boolean
  score: number | null
  anchor: HTMLAnchorElement | null
}

type NativeTextCandidate = {
  node: Text
  index: number
  matchedText: string
  score: number
  currentAnchor: HTMLAnchorElement | null
}

function currentAnchorForNode(
  node: Text,
  container: Element,
  anchorId: string
): HTMLAnchorElement | null {
  let parent = node.parentElement
  while (parent) {
    if (parent.tagName === "A") {
      return parent.id === anchorId && container.contains(parent)
        ? (parent as HTMLAnchorElement)
        : null
    }
    if (parent === container) return null
    parent = parent.parentElement
  }
  return null
}

function hasSkippedAncestor(
  node: Text,
  container: Element,
  currentAnchor: HTMLAnchorElement | null
): boolean {
  let parent = node.parentElement
  while (parent && parent !== container) {
    if (SKIPPED_TAGS.has(parent.tagName) && parent !== currentAnchor)
      return true
    parent = parent.parentElement
  }
  return parent === container && SKIPPED_TAGS.has(container.tagName)
}

function structuralScore(node: Text, container: Element): number {
  let score = 0
  let parent: Element | null = node.parentElement
  while (parent) {
    if (/^H[1-3]$/.test(parent.tagName)) score = Math.max(score, 40)
    else if (parent.matches("strong, b")) score = Math.max(score, 30)
    else if (/^H[4-6]$/.test(parent.tagName)) score = Math.max(score, 25)
    else if (parent.tagName === "P") score = Math.max(score, 10)
    if (parent === container) break
    parent = parent.parentElement
  }
  return score
}

function scoringContext(
  node: Text,
  container: Element,
  nodeOffset: number
): { text: string; keywordOffset: number } {
  let parent = node.parentElement
  while (parent && parent !== container) {
    if (parent.matches("h1, h2, h3, h4, h5, h6, p, li, blockquote")) {
      const walker = node.ownerDocument.createTreeWalker(
        parent,
        node.ownerDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4
      )
      let contextOffset = 0
      let contextNode = walker.nextNode() as Text | null
      while (contextNode && contextNode !== node) {
        contextOffset += contextNode.data.length
        contextNode = walker.nextNode() as Text | null
      }
      return {
        text: parent.textContent ?? node.data,
        keywordOffset: contextOffset + nodeOffset,
      }
    }
    parent = parent.parentElement
  }
  return { text: node.data, keywordOffset: nodeOffset }
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function isInside(node: Text, container: Element, selector: string): boolean {
  const ancestor = node.parentElement?.closest(selector)
  return (
    ancestor !== null && ancestor !== undefined && container.contains(ancestor)
  )
}

function candidateScore(
  node: Text,
  container: Element,
  nodeOffset: number,
  keywordLength: number,
  absoluteOffset: number,
  totalTextLength: number
): number {
  const { text: contextText, keywordOffset } = scoringContext(
    node,
    container,
    nodeOffset
  )
  const context = contextText.toLowerCase()
  let score = structuralScore(node, container)
  if (containsAny(context, PURCHASE_INTENT)) score += 35
  if (containsAny(context, RECOMMEND_INTENT)) score += 25
  if (containsAny(context, BENEFIT_INTENT)) score += 20
  if (containsAny(context, NEGATIVE_INTENT)) score -= 30

  const relativeOffset =
    totalTextLength === 0 ? 0 : absoluteOffset / totalTextLength
  if (relativeOffset >= 0.2 && relativeOffset <= 0.45) score += 15
  if (/[.!?。！？]/.test(context.slice(keywordOffset + keywordLength)))
    score += 10
  if (isInside(node, container, "blockquote, li")) score -= 15
  return score
}

function collectCandidates(
  container: Element,
  instruction: NativeTextInstruction
): NativeTextCandidate[] {
  const document = container.ownerDocument
  const walker = document.createTreeWalker(
    container,
    document.defaultView?.NodeFilter.SHOW_TEXT ?? 4
  )
  const nodes: Text[] = []
  let node = walker.nextNode() as Text | null
  while (node) {
    nodes.push(node)
    node = walker.nextNode() as Text | null
  }

  const candidates: NativeTextCandidate[] = []
  const keyword = instruction.keyword.toLowerCase()
  const totalTextLength = container.textContent?.length ?? 0
  let textOffset = 0

  for (const textNode of nodes) {
    const currentAnchor = currentAnchorForNode(
      textNode,
      container,
      instruction.anchor_dom_id
    )
    if (!hasSkippedAncestor(textNode, container, currentAnchor)) {
      const lowercaseText = textNode.data.toLowerCase()
      let index = lowercaseText.indexOf(keyword)
      while (index !== -1) {
        candidates.push({
          node: textNode,
          index,
          matchedText: textNode.data.slice(
            index,
            index + instruction.keyword.length
          ),
          score: candidateScore(
            textNode,
            container,
            index,
            instruction.keyword.length,
            textOffset + index,
            totalTextLength
          ),
          currentAnchor,
        })
        index = lowercaseText.indexOf(
          keyword,
          index + instruction.keyword.length
        )
      }
    }
    textOffset += textNode.data.length
  }
  return candidates
}

function createAnchor(
  document: Document,
  instruction: NativeTextInstruction,
  matchedText: string,
  score: number,
  reportClick: (url: string) => void
): HTMLAnchorElement {
  const anchor = document.createElement("a")
  anchor.id = instruction.anchor_dom_id
  anchor.href = instruction.landing_url
  anchor.target = "_blank"
  anchor.rel = "noopener noreferrer sponsored"
  anchor.textContent = matchedText
  anchor.dataset.adAnchor = "native-text"
  anchor.dataset.adPlacementScore = String(score)
  anchor.addEventListener("click", () =>
    reportClick(instruction.click_tracking_url)
  )
  anchor.className =
    "text-primary decoration-primary/50 hover:decoration-primary font-medium underline underline-offset-2"
  return anchor
}

function insertAnchor(
  candidate: NativeTextCandidate,
  instruction: NativeTextInstruction,
  reportClick: (url: string) => void
): HTMLAnchorElement {
  const { node, index, matchedText, score } = candidate
  const document = node.ownerDocument
  const before = node.data.slice(0, index)
  const after = node.data.slice(index + instruction.keyword.length)
  const anchor = createAnchor(
    document,
    instruction,
    matchedText,
    score,
    reportClick
  )
  const fragment = document.createDocumentFragment()
  if (before) fragment.append(document.createTextNode(before))
  fragment.append(anchor)
  if (after) fragment.append(document.createTextNode(after))
  node.replaceWith(fragment)
  return anchor
}

function placementScore(anchor: HTMLAnchorElement): number | null {
  const stored = anchor.dataset.adPlacementScore
  if (stored === undefined) return null
  const score = Number(stored)
  return Number.isFinite(score) ? score : null
}

function findCurrentAnchor(
  container: Element,
  anchorId: string
): HTMLAnchorElement | null {
  for (const anchor of container.querySelectorAll<HTMLAnchorElement>("a")) {
    if (anchor.id === anchorId) return anchor
  }
  return null
}

export function shouldMoveNativeTextAnchor(
  currentScore: number,
  nextScore: number,
  finalized: boolean,
  threshold = 15
): boolean {
  return (
    nextScore > currentScore &&
    (finalized || nextScore - currentScore >= threshold)
  )
}

export function placeNativeTextAnchor(
  container: Element,
  instruction: NativeTextInstruction,
  options: NativeTextPlacementOptions = {}
): NativeTextPlacementResult {
  const reportClick = options.reportClick ?? (() => undefined)
  const candidates = collectCandidates(container, instruction)
  const currentAnchor = findCurrentAnchor(container, instruction.anchor_dom_id)
  const best = candidates.reduce<NativeTextCandidate | null>(
    (selected, candidate) =>
      selected === null || candidate.score > selected.score
        ? candidate
        : selected,
    null
  )

  if (!best) {
    return {
      placed: currentAnchor !== null,
      moved: false,
      score: currentAnchor ? placementScore(currentAnchor) : null,
      anchor: currentAnchor,
    }
  }

  if (currentAnchor) {
    const currentCandidate = candidates.find(
      (candidate) => candidate.currentAnchor === currentAnchor
    )
    const currentScore =
      placementScore(currentAnchor) ?? currentCandidate?.score ?? best.score

    if (best.currentAnchor === currentAnchor) {
      currentAnchor.dataset.adPlacementScore = String(best.score)
      return {
        placed: true,
        moved: false,
        score: best.score,
        anchor: currentAnchor,
      }
    }

    if (
      shouldMoveNativeTextAnchor(
        currentScore,
        best.score,
        options.finalized ?? false,
        options.moveThreshold
      )
    ) {
      currentAnchor.replaceWith(
        container.ownerDocument.createTextNode(currentAnchor.textContent ?? "")
      )
      const anchor = insertAnchor(best, instruction, reportClick)
      return { placed: true, moved: true, score: best.score, anchor }
    }

    return {
      placed: true,
      moved: false,
      score: currentScore,
      anchor: currentAnchor,
    }
  }

  const anchor = insertAnchor(best, instruction, reportClick)
  return { placed: true, moved: false, score: best.score, anchor }
}

export function injectNativeTextAnchor(
  container: Element,
  instruction: NativeTextInstruction,
  reportClick: (url: string) => void = () => undefined
): boolean {
  return placeNativeTextAnchor(container, instruction, { reportClick }).placed
}
