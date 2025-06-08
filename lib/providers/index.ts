import React from "react"
import Anthropic from "@/components/icons/anthropic"
import Claude from "@/components/icons/claude"
import DeepSeek from "@/components/icons/deepseek"
import Gemini from "@/components/icons/gemini"
import Google from "@/components/icons/google"
import Grok from "@/components/icons/grok"
import Mistral from "@/components/icons/mistral"
import Ollama from "@/components/icons/ollama"
import OpenAI from "@/components/icons/openai"
import OpenRouter from "@/components/icons/openrouter"
import Xai from "@/components/icons/xai"

export type Provider = {
  id: string
  name: string
  available: boolean
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export const PROVIDERS: Provider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    available: true,
    icon: OpenRouter,
  },
  {
    id: "openai",
    name: "OpenAI",
    available: true,
    icon: OpenAI,
  },
  {
    id: "mistral",
    name: "Mistral",
    available: true,
    icon: Mistral,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    available: true,
    icon: DeepSeek,
  },
  {
    id: "gemini",
    name: "Gemini",
    available: true,
    icon: Gemini,
  },
  {
    id: "claude",
    name: "Claude",
    available: true,
    icon: Claude,
  },
  {
    id: "grok",
    name: "Grok",
    available: true,
    icon: Grok,
  },
  {
    id: "xai",
    name: "xAI",
    available: true,
    icon: Xai,
  },
  {
    id: "google",
    name: "Google",
    available: true,
    icon: Google,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    available: true,
    icon: Anthropic,
  },
  {
    id: "ollama",
    name: "Ollama",
    available: true,
    icon: Ollama,
  },
  {
    id: "meta",
    name: "Meta",
    available: true,
    icon: Ollama,
  },
  {
    id: "alibaba",
    name: "Alibaba",
    available: true,
    icon: Ollama,
  },
] as Provider[]
