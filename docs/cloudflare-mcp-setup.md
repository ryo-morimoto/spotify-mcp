# Cloudflare MCP Server Setup Guide

This guide explains how to set up Cloudflare MCP servers for deploying and managing the Spotify MCP server on Cloudflare Workers.

## Prerequisites

1. Cloudflare account
2. Claude Desktop application
3. Node.js and npm installed
4. `mcp-remote` package (will be installed automatically via npx)

## About Cloudflare MCP Servers

Cloudflare provides MCP servers that can be accessed in two ways:

1. **Direct Connection (Recommended)**: Using `mcp-remote` to connect to SSE endpoints
2. **OpenAI Responses API**: Requires API token configuration

This guide uses the direct connection method, which is simpler and doesn't require API credentials for basic usage.

## Step 1: Configure Claude Desktop

## Step 2: Install Configuration

1. Create or edit the MCP configuration file at `~/.claude/.mcp.json`
2. Add the following MCP server configurations:

```json
{
  "mcpServers": {
    "cloudflare-observability": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://observability.mcp.cloudflare.com/sse"
      ]
    },
    "cloudflare-bindings": {
      "command": "npx",
      "args": [
        "mcp-remote", 
        "https://bindings.mcp.cloudflare.com/sse"
      ]
    },
    "cloudflare-container": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://container.mcp.cloudflare.com/sse"
      ]
    }
  }
}
```

3. Restart Claude Desktop

## Step 3: Verify MCP Server Connection

After restarting Claude Desktop, the Cloudflare MCP servers should be available. The servers will connect to Cloudflare's public SSE endpoints.

**Note**: Some operations may require authentication. If you need to perform authenticated operations (like deploying Workers or managing KV stores), you'll need to:

1. Create an API token in the [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Configure the token with appropriate permissions
3. Follow Cloudflare's documentation for authenticated access

## Available MCP Servers

### 1. Workers Observability Server (`cloudflare-observability`)
- View real-time logs from Workers
- Analyze performance metrics
- Debug production issues
- Monitor request patterns and errors

### 2. Workers Bindings Server (`cloudflare-bindings`)
- Manage Workers KV, R2, D1, and other bindings
- Create and update Worker scripts
- Handle storage operations
- Configure Worker settings

### 3. Container Server (`cloudflare-container`)
- Run isolated containers on Cloudflare's network
- Test code in a sandboxed environment
- Execute scripts safely
- Prototype and debug Workers

## Usage Examples

Once connected, the MCP servers provide various tools. The exact commands depend on your authentication status:

### Public Operations (No Auth Required)
- View public documentation
- Check service status
- Access public APIs

### Authenticated Operations (API Token Required)
- Deploy and manage Workers
- Access KV stores and Durable Objects
- View detailed logs and analytics
- Manage bindings and configurations

## Troubleshooting

1. **MCP servers not appearing**: Ensure you've restarted Claude Desktop after configuration
2. **Connection issues**: Check that npx can download packages and connect to Cloudflare's SSE endpoints
3. **Authentication required**: Some operations need API tokens - check Cloudflare's documentation
4. **Network errors**: Ensure your firewall allows connections to *.mcp.cloudflare.com

## Security Notes

- The direct connection method uses public SSE endpoints
- For authenticated operations, create API tokens with minimal required permissions
- Never commit API tokens to version control
- Monitor access logs for suspicious activity

## Additional Resources

- [Cloudflare MCP Servers GitHub](https://github.com/cloudflare/mcp-server-cloudflare)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)