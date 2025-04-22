import { z } from "zod"

// Search result types
export type SearchSource = {
  title: string
  url: string
  snippet: string
}

export type SearchResult = {
  query: string
  sources: SearchSource[]
}

// Research finding types
export type ResearchFinding = {
  query: string
  summary: string
  citations: SearchSource[]
}

// Analysis results
export type SufficiencyAnalysis = {
  sufficient: boolean
  missing: string[]
  followupQueries: string[]
}

// Output types
export type AgentPart = {
  type: string
  source: {
    sourceType: string
    id: string
    url: string
    title: string
  }
}

export type AgentOutput = {
  markdown: string
  parts: AgentPart[]
}

// Standard HTTP response formatter
export function jsonRes(
  body: Record<string, unknown>,
  status = 200,
  headers: HeadersInit = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}
