import { experimental_createMCPClient as createMCPClient } from "ai"

export async function loadMCPToolsFromURL(url: string) {
  const mcpClient = await createMCPClient({
    transport: {
      type: "sse",
      url,
    },
  })

  const tools = await mcpClient.tools()
  return { tools, close: () => mcpClient.close() }
}
