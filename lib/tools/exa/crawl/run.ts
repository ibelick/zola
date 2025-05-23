type Input = {
  url: string
}

export async function runCrawl(input: Input) {
  const { url } = input

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
    const res = await fetch("https://api.exa.ai/contents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": process.env.EXA_API_KEY,
      },
      body: JSON.stringify({
        ids: [url],
        text: true,
        livecrawl: "always",
      }),
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData?.message || "Unknown Exa error")
    }

    const data = await res.json()

    if (!data?.results?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No content found at the specified URL. Please check the URL and try again.",
          },
        ],
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(data, null, 2),
        },
      ],
    }
  } catch (err: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Crawling error: ${err.message || String(err)}`,
        },
      ],
      isError: true,
    }
  }
}
