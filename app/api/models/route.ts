import { NextResponse } from "next/server"
import { getAllModels, refreshModelsCache } from "@/lib/models"

export async function GET() {
  try {
    const models = await getAllModels()

    return new Response(JSON.stringify({ models }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error fetching models:", error)
    return new Response(
      JSON.stringify({ error: "Failed to fetch models" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}

export async function POST() {
  try {
    // Refresh the models cache
    refreshModelsCache()
    const models = await getAllModels()
    
    return NextResponse.json({
      message: "Models cache refreshed",
      models,
      timestamp: new Date().toISOString(),
      count: models.length,
    })
  } catch (error) {
    console.error("Failed to refresh models:", error)
    return NextResponse.json(
      { error: "Failed to refresh models" },
      { status: 500 }
    )
  }
} 