import {
  BookOpenText,
  Brain,
  Code,
  Lightbulb,
  Notepad,
  PaintBrush,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr"

export const NON_AUTH_DAILY_MESSAGE_LIMIT = 5 // For any non-KSU users (should be minimal)
export const AUTH_DAILY_MESSAGE_LIMIT = 10000 // Effectively unlimited for KSU faculty/staff
export const REMAINING_QUERY_ALERT_THRESHOLD = 100 // Higher threshold before showing alerts
export const DAILY_FILE_UPLOAD_LIMIT = 100 // Generous limit for faculty and staff
export const DAILY_LIMIT_PRO_MODELS = 10000 // Effectively unlimited for KSU faculty/staff

export const NON_AUTH_ALLOWED_MODELS = ["gpt-4.1-nano"]

export const FREE_MODELS_IDS = [
  "gpt-3.5-turbo",
  "gpt-4-turbo",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4.5-preview",
  "gpt-4o",
  "gpt-4o-mini",
  "o1",
  "o3-mini",
  "o1-mini",
  "o3",
  "o4-mini",
]

export const MODEL_DEFAULT = "gpt-4o-mini"

export const APP_NAME = "Parley"
export const APP_DOMAIN = "https://theparley.org"

export const SUGGESTIONS = [
  {
    label: "Research Planning",
    highlight: "Help me plan",
    prompt: `Help me plan`,
    items: [
      "Help me plan a literature review for my research proposal",
      "Help me plan a grant application strategy",
      "Help me plan my sabbatical research project",
      "Help me plan a multi-phase research study",
    ],
    icon: Notepad,
  },
  {
    label: "Data Analysis",
    highlight: "Analyze",
    prompt: `Analyze`,
    items: [
      "Analyze survey data patterns for statistical significance",
      "Analyze qualitative interview themes",
      "Analyze research methodology strengths and weaknesses",
      "Analyze citation trends in my field",
    ],
    icon: Code,
  },
  {
    label: "Academic Writing",
    highlight: "Help me write",
    prompt: `Help me write`,
    items: [
      "Help me write an abstract for my research paper",
      "Help me write a compelling research hypothesis",
      "Help me write a methodology section",
      "Help me write a grant proposal summary",
    ],
    icon: PaintBrush,
  },
  {
    label: "Literature Review",
    highlight: "Research",
    prompt: `Research`,
    items: [
      "Research recent developments in sustainable energy policy",
      "Research methodological approaches in educational psychology",
      "Research funding opportunities for interdisciplinary studies",
      "Research collaboration opportunities with industry partners",
    ],
    icon: BookOpenText,
  },
  {
    label: "Teaching Support",
    highlight: "Design",
    prompt: `Design`,
    items: [
      "Design engaging activities for graduate seminars",
      "Design assessment rubrics for research projects",
      "Design a course curriculum for advanced students",
      "Design interactive learning experiences",
    ],
    icon: Sparkle,
  },
  {
    label: "Critical Thinking",
    highlight: "Evaluate",
    prompt: `Evaluate`,
    items: [
      "Evaluate the ethical implications of this research approach",
      "Evaluate competing theories in my field",
      "Evaluate the validity of research instruments",
      "Evaluate potential research collaboration benefits",
    ],
    icon: Brain,
  },
  {
    label: "Knowledge Synthesis",
    highlight: "Explain",
    prompt: `Explain`,
    items: [
      "Explain complex theories to undergraduate students",
      "Explain research findings to non-academic stakeholders",
      "Explain the broader implications of my research",
      "Explain interdisciplinary connections in my work",
    ],
    icon: Lightbulb,
  },
]

export const SYSTEM_PROMPT_DEFAULT = `You are Parley, an AI assistant designed specifically for Kennesaw State University faculty and staff. You provide thoughtful, academically-oriented support for research, teaching, and administrative tasks. Your tone is professional yet approachable, scholarly but accessible. You understand the academic environment and can help with literature reviews, research planning, grant writing, course design, data analysis, and academic collaboration. You ask insightful questions to clarify research objectives and offer evidence-based suggestions. You respect the rigor of academic work while making complex topics understandable.`

export const MESSAGE_MAX_LENGTH = 10000
