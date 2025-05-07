import Exa from "exa-js"

const exa = new Exa(process.env.EXA_API_KEY!)

export async function searchWeb(
  query: string
): Promise<{ title: string; url: string; snippet: string }[]> {
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
    throw new Error("searchWeb failed")
  }
}
