const openaiModels = [
  { id: "gpt-3-5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI" },
  {
    id: "gpt-3-5-turbo-instruct",
    name: "GPT-3.5 Turbo Instruct",
    provider: "OpenAI",
  },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "gpt-4-1", name: "GPT-4.1", provider: "OpenAI" },
  { id: "gpt-4-1-mini", name: "GPT-4.1 Mini", provider: "OpenAI" },
  { id: "gpt-4-1-nano", name: "GPT-4.1 Nano", provider: "OpenAI" },
  { id: "gpt-4-5-preview", name: "GPT-4.5 Preview", provider: "OpenAI" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "o3", name: "o3", provider: "OpenAI" },
  { id: "o3-mini", name: "o3-mini", provider: "OpenAI" },
  { id: "o3-mini-high", name: "o3-mini (High)", provider: "OpenAI" },
  { id: "o3-mini-low", name: "o3-mini (Low)", provider: "OpenAI" },
  { id: "o3-mini-medium", name: "o3-mini (Medium)", provider: "OpenAI" },
  { id: "o4-mini", name: "o4-mini", provider: "OpenAI" },
]

export { openaiModels }
