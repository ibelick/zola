import { experimental_createMCPClient as createMCPClient } from "ai"
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio"

export async function loadMCPToolsFromLocal(
  command: string,
  env: Record<string, string> = {}
) {
  const mcpClient = await createMCPClient({
    transport: new StdioMCPTransport({
      command,
      args: ["stdio"],
      env,
    }),
  })

  const tools = await mcpClient.tools()
  return { tools, close: () => mcpClient.close() }
}
