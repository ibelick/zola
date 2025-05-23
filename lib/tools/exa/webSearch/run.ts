type Input = {
  query: string
  numResults?: number
}

export async function runWebSearch(input: Input) {
  const { query, numResults = 5 } = input

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
          text: {
            maxCharacters: 12000,
          },
          livecrawl: "always",
        },
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error?.message || "Unknown error from Exa")
    }

    const data = await res.json()

    if (!data?.results?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No search results found.",
          },
        ],
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(data.results, null, 2),
        },
      ],
    }
  } catch (err: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Search error: ${err.message || String(err)}`,
        },
      ],
      isError: true,
    }
  }
}
