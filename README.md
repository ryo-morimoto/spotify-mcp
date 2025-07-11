# Spotify MCP Server

A secure Model Context Protocol (MCP) server for Spotify with OAuth authentication.
Deployed on Cloudflare Workers for global edge distribution.

## Features

- **Secure OAuth Authentication** - PKCE-based OAuth flow for secure Spotify access
- **Spotify Search** - Search for tracks, artists, albums, and playlists
- **Cloudflare Workers** - Serverless deployment with global edge distribution
- **Token Management** - Secure token storage using Cloudflare KV
- **CORS Support** - Configurable CORS for various MCP clients

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account
- Spotify Developer account

### Installation

```bash
# Clone the repository
git clone https://github.com/ryo-morimoto/spotify-mcp.git
cd spotify-mcp

# Install dependencies
pnpm install

# Copy configuration template
cp wrangler.toml.example wrangler.toml
```

### Configuration

1. Create a Spotify App at [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Set up Cloudflare KV namespace and update `wrangler.toml`
3. Configure environment secrets

See [docs/deployment.md](docs/deployment.md) for detailed setup instructions.

### Deployment

```bash
# Deploy to Cloudflare Workers
pnpm wrangler deploy
```

## Usage with MCP Clients

This server implements the OAuth 2.0 authorization flow for MCP. Compatible clients will:

1. Discover OAuth endpoints via `/.well-known/oauth-authorization-server`
2. Register dynamically at `/auth/register`
3. Initiate authorization flow
4. Exchange tokens and access Spotify functionality

## Available Tools

- **search-tracks** - Search Spotify catalog
  - Parameters: `query` (search term), `type` (track/artist/album/playlist), `limit` (1-50)

## Development

```bash
# Run locally
pnpm dev

# Run tests
pnpm test

# Run all checks (type check, tests, format, lint)
pnpm check
```

## Architecture

- **Type-safe** - Full TypeScript with Result types for error handling
- **Functional** - No exceptions, all errors as values
- **Modular** - Clear separation of concerns
- **Testable** - Mock-free testing approach

## Security

- OAuth 2.0 with PKCE for public clients
- No client secrets required
- Token isolation per MCP client
- Configurable CORS policies

## Contributing

Contributions are welcome. Please read our contributing guidelines and follow the project's coding conventions.

## License

MIT

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Cloudflare Workers](https://workers.cloudflare.com/)