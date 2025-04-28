import {
  // analyzeSufficiency,
  generateReport,
  generateReportTitle,
  generateSearchQueries,
  summarizeSources,
} from "@/app/api/agents/core/tools/ai"
import { fetchSearchResults } from "@/app/api/agents/core/tools/search"
import { AgentOutput } from "@/app/api/agents/core/types"
import { generateCitationData } from "../core/tools/utils"

/**
 * Research agent that generates a report based on web search results
 */
export async function runResearchAgent(prompt: string): Promise<AgentOutput> {
  // 1. Generate a title for the report
  const reportTitle = await generateReportTitle(prompt)

  // 2. Generate search queries based on the prompt
  const searchQueries = await generateSearchQueries(prompt)

  // 3. Fetch search results for each query
  const searchResults = await fetchSearchResults(searchQueries)

  // 4. Summarize the search results into findings
  const summaries = await summarizeSources(searchResults)

  // 5. Optional: Analyze if findings are sufficient (commented out in original)
  // const analysisResult = await analyzeSufficiency(summaries, prompt)

  // 6. Generate a final markdown report
  const report = await generateReport(summaries, reportTitle)
  const { citationParts } = generateCitationData(summaries)

  // 7. Return the report and source citations
  return {
    markdown: report,
    parts: citationParts,
  }
}
