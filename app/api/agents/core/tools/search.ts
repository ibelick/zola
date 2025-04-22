import Exa from "exa-js"
import { SearchResult, SearchSource } from "../types"

// Initialize Exa client
const exa = new Exa(process.env.EXA_API_KEY!)

/**
 * Execute search queries and return results with unique sources
 */
export async function fetchSearchResults(
  queries: string[]
): Promise<SearchResult[]> {
  const searchResults = await Promise.all(
    queries.map(async (query) => {
      const { results } = await exa.searchAndContents(query, {
        livecrawl: "always",
        numResults: 3,
      })
      const seen = new Set<string>()
      const unique = results
        .filter((r) => r.url && !seen.has(r.url) && seen.add(r.url))
        .slice(0, 2)

      return {
        query,
        sources: unique.map((r) => ({
          title: r.title ?? "Untitled",
          url: r.url!,
          snippet: (r.text ?? "").slice(0, 350),
        })),
      }
    })
  )

  return searchResults
}
