import { config as crawlConfig } from "./crawl/config"
import { crawlTool } from "./crawl/tool"
import { config as webSearchConfig } from "./webSearch/config"
import { webSearchTool } from "./webSearch/tool"

const isAvailable = (envVars: string[]) => {
  return envVars.every((v) => !!process.env[v])
}

export const exaTools = {
  "exa.webSearch": {
    ...webSearchTool,
    isAvailable: () => isAvailable(webSearchConfig.envVars),
  },
  "exa.crawl": {
    ...crawlTool,
    isAvailable: () => isAvailable(crawlConfig.envVars),
  },
}
