import Exa from "exa-js"

const exaApiKey = process.env.EXA_API_KEY
const exa = exaApiKey ? new Exa(exaApiKey) : null

export async function searchWeb(
  query: string
): Promise<{ title: string; url: string; snippet: string }[]> {
  if (!exa) {
    console.warn("searchWeb skipped: EXA_API_KEY not set")
    return []
  }

  try {
    const result = await exa.searchAndContents(query, {
      numResults: 3,
      livecrawl: "always",
    })

    return result.results.map((r) => ({
      title: r.title || "Untitled",
      url: r.url,
      snippet: r.text?.slice(0, 200) || "",
    }))
  } catch (error) {
    console.error("Error in searchWeb:", error)
    return []
  }
}
