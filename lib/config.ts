import Claude from "@/components/icons/claude"
import DeepSeek from "@/components/icons/deepseek"
import Gemini from "@/components/icons/gemini"
import Grok from "@/components/icons/grok"
import Mistral from "@/components/icons/mistral"
import OpenAI from "@/components/icons/openai"
import OpenRouter from "@/components/icons/openrouter"
import {
  BookOpenText,
  Brain,
  Code,
  Lightbulb,
  Notepad,
  PaintBrush,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr"
import { openproviders, OpenProvidersOptions } from "./openproviders"
import { SupportedModel } from "./openproviders/types"

export const NON_AUTH_DAILY_MESSAGE_LIMIT = 5
export const AUTH_DAILY_MESSAGE_LIMIT = 1000
export const REMAINING_QUERY_ALERT_THRESHOLD = 2
export const DAILY_FILE_UPLOAD_LIMIT = 5
export const DAILY_SPECIAL_AGENT_LIMIT = 2
export const DAILY_LIMIT_PRO_MODELS = 5

export type Model = {
  id: string
  name: string
  provider: string
  available?: boolean
  api_sdk?: OpenProvidersOptions<SupportedModel>
  features?: {
    id: string
    enabled: boolean
  }[]
  description?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export const MODELS_FREE = [
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "openrouter",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: "deepseek/deepseek-r1:free", // this is a special case for openrouter
    description:
      "A reasoning-first model trained with reinforcement learning, built for math, code, and complex problem solving",
    icon: DeepSeek,
  },
  {
    id: "pixtral-large-latest",
    name: "Pixtral Large",
    provider: "mistral",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("pixtral-large-latest"),
    description:
      "Mistral’s flagship model. Great for reasoning, writing, and advanced tasks.",
    icon: Mistral,
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    provider: "mistral",
    features: [
      {
        id: "file-upload",
        enabled: false,
      },
    ],
    api_sdk: openproviders("mistral-large-latest"),
    description:
      "Fine-tuned for chat. A lighter, faster option for everyday use.",
    icon: Mistral,
  },
  // free for now
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("gpt-4.1-nano"),
    description:
      "Ultra fast and cheap. Ideal for simple tasks, summaries, or classification.",
    icon: OpenAI,
  },
]

export const MODELS_PRO = [
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("gpt-4.1"),
    description:
      "OpenAI’s most powerful model. Excellent at coding, writing, and complex tasks.",
    icon: OpenAI,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("gpt-4.1-mini"),
    description:
      "Fast and smart — a great balance for most tasks. Outperforms GPT‑4o mini.",
    icon: OpenAI,
  },
  // {
  //   id: "gpt-4.1-nano",
  //   name: "GPT-4.1 Nano",
  //   provider: "openai",
  //   features: [
  //     {
  //       id: "file-upload",
  //       enabled: true,
  //     },
  //   ],
  //   api_sdk: openproviders("gpt-4.1-nano"),
  //   description:
  //     "Ultra fast and cheap. Ideal for simple tasks, summaries, or classification.",
  //   icon: OpenAI,
  // },
  {
    id: "gemini-2.5-pro-preview-03-25",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("gemini-2.5-pro-exp-03-25"),
    description: "Advanced reasoning, coding, and multimodal understanding.",
    icon: Gemini,
  },
  {
    id: "gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("gemini-2.0-flash-001"),
    description: "Fast and cost-efficient with streaming and real-time output.",
    icon: Gemini,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("gemini-1.5-pro"),
    description: "Smart general-purpose model for complex reasoning tasks.",
    icon: Gemini,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "gemini",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("gemini-1.5-flash"),
    description: "Balanced speed and quality, great for a variety of tasks.",
    icon: Gemini,
  },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("claude-3-7-sonnet-20250219"),
    description:
      "Anthropic’s most intelligent model. Excels at step-by-step reasoning and complex tasks.",
    icon: Claude,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("claude-3-5-haiku-20241022"),
    description:
      "Fastest and most cost-effective Claude model. Ideal for quick, everyday tasks.",
    icon: Claude,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "anthropic",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
    ],
    api_sdk: openproviders("claude-3-opus-20240229"),
    description:
      "Anthropic’s most powerful model for highly complex reasoning and generation tasks.",
    icon: Claude,
  },
]

// export const MODELS_NOT_AVAILABLE = [
// {
//     id: "grok-2",
//     name: "Grok 2",
//     provider: "grok",
//     available: false,
//     api_sdk: false,
//     features: [
//       {
//         id: "file-upload",
//         enabled: true,
//       },
//     ],
//     icon: Grok,
//   },
// ] as Model[]

export const MODELS_OPTIONS = [...MODELS_FREE, ...MODELS_PRO] as Model[]

export type Provider = {
  id: string
  name: string
  available: boolean
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export const PROVIDERS = [
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: OpenRouter,
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: OpenAI,
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: Mistral,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: DeepSeek,
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: Gemini,
  },
  {
    id: "claude",
    name: "Claude",
    icon: Claude,
  },
  {
    id: "grok",
    name: "Grok",
    icon: Grok,
  },
] as Provider[]

export const MODEL_DEFAULT = "pixtral-large-latest"

export const APP_NAME = "Zola"
export const APP_DOMAIN = "https://zola.chat"
export const APP_DESCRIPTION =
  "Zola is a free, open-source AI chat app with multi-model support."

export const SUGGESTIONS = [
  {
    label: "Summary",
    highlight: "Summarize",
    prompt: `Summarize`,
    items: [
      "Summarize the French Revolution",
      "Summarize the plot of Inception",
      "Summarize World War II in 5 sentences",
      "Summarize the benefits of meditation",
    ],
    icon: Notepad,
  },
  {
    label: "Code",
    highlight: "Help me",
    prompt: `Help me`,
    items: [
      "Help me write a function to reverse a string in JavaScript",
      "Help me create a responsive navbar in HTML/CSS",
      "Help me write a SQL query to find duplicate emails",
      "Help me convert this Python function to JavaScript",
    ],
    icon: Code,
  },
  {
    label: "Design",
    highlight: "Design",
    prompt: `Design`,
    items: [
      "Design a color palette for a tech blog",
      "Design a UX checklist for mobile apps",
      "Design 5 great font pairings for a landing page",
      "Design better CTAs with useful tips",
    ],
    icon: PaintBrush,
  },
  {
    label: "Research",
    highlight: "Research",
    prompt: `Research`,
    items: [
      "Research the pros and cons of remote work",
      "Research the differences between Apple Vision Pro and Meta Quest",
      "Research best practices for password security",
      "Research the latest trends in renewable energy",
    ],
    icon: BookOpenText,
  },
  {
    label: "Get inspired",
    highlight: "Inspire me",
    prompt: `Inspire me`,
    items: [
      "Inspire me with a beautiful quote about creativity",
      "Inspire me with a writing prompt about solitude",
      "Inspire me with a poetic way to start a newsletter",
      "Inspire me by describing a peaceful morning in nature",
    ],
    icon: Sparkle,
  },
  {
    label: "Think deeply",
    highlight: "Reflect on",
    prompt: `Reflect on`,
    items: [
      "Reflect on why we fear uncertainty",
      "Reflect on what makes a conversation meaningful",
      "Reflect on the concept of time in a simple way",
      "Reflect on what it means to live intentionally",
    ],
    icon: Brain,
  },
  {
    label: "Learn gently",
    highlight: "Explain",
    prompt: `Explain`,
    items: [
      "Explain quantum physics like I'm 10",
      "Explain stoicism in simple terms",
      "Explain how a neural network works",
      "Explain the difference between AI and AGI",
    ],
    icon: Lightbulb,
  },
]

export const SYSTEM_PROMPT_DEFAULT = `You are Zola, a thoughtful and clear assistant. Your tone is calm, minimal, and human. You write with intention—never too much, never too little. You avoid clichés, speak simply, and offer helpful, grounded answers. When needed, you ask good questions. You don’t try to impress—you aim to clarify. You may use metaphors if they bring clarity, but you stay sharp and sincere. You're here to help the user think clearly and move forward, not to overwhelm or overperform.`

export const MESSAGE_MAX_LENGTH = 4000

export const ZOLA_AGENTS_SLUGS = [
  "tweet-vibe-checker",
  "clear-ux-copywriter",
  "0-to-1-advisor",
  "pull-check",
  "blog-draft",
  "inbox-fix",
  "name-vibe-check",
  "tiny-essay",
  "solene",
  "eloi",
]

export const ZOLA_SPECIAL_AGENTS_SLUGS = ["research"]

export const ZOLA_GITHUB_AGENTS_SLUGS = [
  "github/ibelick/prompt-kit",
  "github/ibelick/zola",
  "github/vercel/ai",
  "github/shadcn/ui",
]

export const ZOLA_COMING_SOON_AGENTS = [
  {
    name: "Linear Agent",
    slug: "linear-agent",
    description: "Create, search, and prioritize issues using the Linear API.",
    system_prompt: "",
    model_preference: "gpt-4o-mini",
    avatar_url: null,
    is_public: false,
    remixable: false,
    tools_enabled: true,
    example_inputs: [
      "Create a bug in project X: login form fails on mobile",
      "List urgent issues in roadmap",
    ],
    tags: ["product", "tools", "linear"],
    category: "b2b",
    id: "linear-agent",
    creator_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    name: "Slack Agent",
    slug: "slack-agent",
    description: "Create, search, and prioritize issues using the Slack API.",
    system_prompt: "",
    model_preference: "gpt-4o-mini",
    avatar_url: null,
    is_public: false,
    remixable: false,
    tools_enabled: true,
    example_inputs: [
      "Create a bug in project X: login form fails on mobile",
      "List urgent issues in roadmap",
    ],
    tags: ["product", "tools", "slack"],
    category: "b2b",
    id: "slack-agent",
    creator_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    name: "Changelog Writer",
    slug: "changelog-writer",
    description:
      "Turns PRs or issue lists into structured changelogs and release notes.",
    system_prompt: "",
    model_preference: "gpt-4o-mini",
    avatar_url: null,
    is_public: false,
    remixable: false,
    tools_enabled: true,
    example_inputs: [
      "Generate a changelog from these PR titles",
      "Write release notes for version 2.3",
    ],
    tags: ["dev", "pm", "changelog"],
    category: "dev",
    id: "changelog-writer",
    creator_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    name: "Growth Analyst",
    slug: "growth-analyst",
    description:
      "Answers product and growth questions by analyzing metrics and user behavior.",
    system_prompt: "",
    model_preference: "gpt-4o-mini",
    avatar_url: null,
    is_public: false,
    remixable: false,
    tools_enabled: true,
    example_inputs: [
      "What changed after the onboarding redesign?",
      "How are weekly active users trending?",
    ],
    tags: ["analytics", "product", "b2b"],
    category: "analytics",
    id: "growth-analyst",
    creator_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
