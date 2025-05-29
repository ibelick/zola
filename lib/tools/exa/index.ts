import { config as crawlConfig } from "./crawl/config"
import { crawlTool } from "./crawl/tool"
import { config as imageSearchConfig } from "./imageSearch/config"
import { imageSearchTool } from "./imageSearch/tool"
import { config as webSearchConfig } from "./webSearch/config"
import { webSearchTool } from "./webSearch/tool"

const isAvailable = (envVars: string[]) => {
  return envVars.every((v) => !!process.env[v])
}

export const exaTools = {
  exaWebSearch: {
    ...webSearchTool,
    isAvailable: () => isAvailable(webSearchConfig.envVars),
  },
  exaCrawl: {
    ...crawlTool,
    isAvailable: () => isAvailable(crawlConfig.envVars),
  },
  exaImageSearch: {
    ...imageSearchTool,
    isAvailable: () => isAvailable(imageSearchConfig.envVars),
  },
}
