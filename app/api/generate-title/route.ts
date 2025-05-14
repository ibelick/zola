import { MODELS_OPTIONS } from "@/lib/config";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LanguageModelV1, generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30; // Shorter duration for title generation

interface GenerateTitleRequest {
  userMessage: string;
  modelId: string; // e.g., 'gpt-4o', 'claude-3-opus-20240229'
}

export async function POST(req: NextRequest) {
  try {
    const { userMessage, modelId } = (await req.json()) as GenerateTitleRequest;

    if (!userMessage || !modelId) {
      return NextResponse.json(
        { error: "Missing userMessage or modelId" },
        { status: 400 }
      );
    }

    const modelConfig = MODELS_OPTIONS.find((m) => m.id === modelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: `Model ${modelId} not found` },
        { status: 404 }
      );
    }

    let modelInstance: LanguageModelV1;

    if (modelConfig.provider === "openrouter") {
      const openRouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      if (typeof modelConfig.api_sdk === 'string') {
        modelInstance = openRouter.chat(modelConfig.api_sdk);
      } else {
        // This case should ideally not happen if lib/config.ts is correct
        console.error(`OpenRouter model config for ${modelId} is invalid: api_sdk is not a string. SDK Entry:`, modelConfig.api_sdk);
        return NextResponse.json({ error: `Configuration error (OpenRouter api_sdk not string) for model ${modelId}` }, { status: 500 });
      }
    } else { // Not OpenRouter: modelConfig.api_sdk should be a LanguageModelV1 instance
      if (typeof modelConfig.api_sdk === 'object' && modelConfig.api_sdk !== null) {
        // Directly use the LanguageModelV1 instance
        modelInstance = modelConfig.api_sdk as LanguageModelV1;
      } else {
        // This case indicates a problem with how modelConfig.api_sdk was set up in lib/config.ts for non-OpenRouter models
        console.error(`api_sdk for non-OpenRouter model ${modelId} is not a valid LanguageModelV1 instance. SDK Entry:`, modelConfig.api_sdk);
        return NextResponse.json({ error: `Configuration error (invalid api_sdk type) for model ${modelId}` }, { status: 500 });
      }
    }

    // The previous !modelInstance check is still valid as a general safeguard,
    // though the specific error messages above are more targeted.
    if (!modelInstance) {
      return NextResponse.json(
        { error: `Could not instantiate model ${modelId} after provider logic.` },
        { status: 500 }
      );
    }

    const titleGenSystemPrompt =
      "You are an assistant that generates concise and relevant titles. " +
      "Based on the user's message, create a 3-7 word title. " +
      "Output ONLY the title text and nothing else. Do not include any prefixes, explanations, or quotation marks unless the title itself requires them.";

    const { text: generatedTitle, finishReason, usage } = await generateText({
      model: modelInstance,
      system: titleGenSystemPrompt,
      prompt: `User Message: "${userMessage}"\n\nTitle:`,
    });

    console.log(
      `Title generated for "${userMessage.substring(0,30)}...". Finish reason: ${finishReason}, Usage: ${JSON.stringify(usage)}`
    );

    if (!generatedTitle || generatedTitle.trim().length === 0) {
      console.warn("AI failed to generate a title or returned empty string for:", userMessage);
      // Fallback to a generic title or the user's input if AI fails
      const fallbackTitle = userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : "");
      return NextResponse.json({ title: fallbackTitle });
    }

    let cleanTitle = generatedTitle.trim();
    // Remove potential surrounding quotes more robustly
    if ((cleanTitle.startsWith('"') && cleanTitle.endsWith('"')) || (cleanTitle.startsWith("'") && cleanTitle.endsWith("'"))) {
      cleanTitle = cleanTitle.substring(1, cleanTitle.length - 1);
    }
    // Further ensure it's a single line and reasonably short
    cleanTitle = cleanTitle.replace(/\n/g, ' ').replace(/\\n/g, ' ').trim();
    if (cleanTitle.length > 100) { // Max length for a title
        cleanTitle = cleanTitle.substring(0, 97) + "...";
    }


    return NextResponse.json({ title: cleanTitle });

  } catch (error: any) {
    console.error("Error in /api/generate-title:", error.message, error.stack);
    // If the error is from the AI provider (e.g., rate limit, auth), it might have a 'cause' or specific structure
    const errorMessage = error.cause?.message || error.message || "Internal server error";
    const errorStatus = error.status || 500; // Use error status if available

    return NextResponse.json(
      { error: errorMessage },
      { status: errorStatus }
    );
  }
}
