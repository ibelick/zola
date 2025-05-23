import { config as webSearchConfig } from "./webSearch/config"
import { runWebSearch } from "./webSearch/run"

export const exaTools = {
  "exa.webSearch": {
    id: "exa.webSearch",
    label: webSearchConfig.label,
    icon: "🧠",
    description: webSearchConfig.description,
    isAvailable: !!process.env.EXA_API_KEY,
    run: runWebSearch,
    config: webSearchConfig,
  },
}
