type Input = {
  query: string
  numResults?: number
}

export async function runImageSearch(input: Input) {
  const { query, numResults = 3 } = input

  if (!process.env.EXA_API_KEY) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Missing EXA_API_KEY in .env.local.",
        },
      ],
      isError: true,
    }
  }

  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        type: "auto",
        numResults,
        contents: {
          text: { maxCharacters: 200 },
          livecrawl: "always",
        },
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error?.message || "Unknown error from Exa")
    }

    const data = await res.json()

    const imageResults = data.results
      .map((r: any) => ({
        title: r.title,
        imageUrl: r.image || r.imageUrl || null,
        sourceUrl: r.url,
      }))
      .filter((r: any) => r.imageUrl)
      .slice(0, numResults)

    return {
      content: [
        {
          type: "images" as const,
          results: imageResults,
        },
      ],
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    return {
      content: [
        {
          type: "text" as const,
          text: `Image search error: ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
}
