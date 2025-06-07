import { TOOL_REGISTRY } from "@/lib/tools"
import { NextResponse } from "next/server"

export async function GET() {
  const availableToolIds = Object.entries(TOOL_REGISTRY)
    .filter(([, tool]) => tool?.isAvailable?.())
    .map(([id]) => id)

  return NextResponse.json({ available: availableToolIds })
}
