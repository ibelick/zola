import { NextResponse } from "next/server"

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    )
  }

  const getMaskedKey = (key: string | undefined) => {
    if (!key || key.length < 4) return null
    return `${"*".repeat(8)}${key.slice(-3)}`
  }

  const tools = [
    {
      id: "exa",
      name: "Exa",
      icon: "🧠",
      description: "Use Exa to power search-based agents.",
      envKeys: ["EXA_API_KEY"],
      connected: Boolean(process.env.EXA_API_KEY),
      maskedKey: getMaskedKey(process.env.EXA_API_KEY),
      sampleEnv: `EXA_API_KEY=your_key_here`,
    },
    {
      id: "github",
      name: "GitHub",
      icon: "🐙",
      description: "Use GitHub Search in your agents.",
      envKeys: ["GITHUB_TOKEN"],
      connected: Boolean(process.env.GITHUB_TOKEN),
      maskedKey: getMaskedKey(process.env.GITHUB_TOKEN),
      sampleEnv: `GITHUB_TOKEN=your_token_here`,
    },
  ]

  return NextResponse.json({ tools })
}
