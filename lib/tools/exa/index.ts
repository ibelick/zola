import { config as webSearchConfig } from "./webSearch/config"
import { runWebSearch } from "./webSearch/run"

const isAvailable = (envVars: string[]) => {
  return envVars.every((v) => !!process.env[v])
}

export const exaTools = {
  "exa.webSearch": {
    id: "exa.webSearch",
    label: webSearchConfig.label,
    icon: "🧠",
    description: webSearchConfig.description,
    isAvailable: () => isAvailable(webSearchConfig.envVars),
    run: runWebSearch,
    config: webSearchConfig,
  },
}
