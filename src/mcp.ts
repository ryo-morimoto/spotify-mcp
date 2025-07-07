import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createMCPServer(): McpServer {
  const server = new McpServer({
    name: "spotify-mcp-server",
    version: "1.0.0",
  });

  return server;
}
