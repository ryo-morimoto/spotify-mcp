# Spotify MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to control Spotify playback through a secure, real-time connection.

## Features

- 🎵 **Full Spotify Control**: Search tracks, control playback, and get current playing status
- 🔐 **Secure Authentication**: OAuth 2.0 with PKCE flow for secure Spotify access
- 🔌 **Real-time Communication**: Server-Sent Events (SSE) for instant updates
- 🤖 **MCP Protocol**: Compatible with Claude and other MCP-enabled AI assistants

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Spotify Developer account
- Spotify Premium account (for playback control)

### Installation

```bash
# Clone the repository
git clone https://github.com/ryo-morimoto/spotify-mcp.git
cd spotify-mcp

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Configuration

1. Create a Spotify App at [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Add `http://localhost:8000/callback` to Redirect URIs
3. Create `.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
PORT=8000
```

### Running the Server

```bash
# Development mode
pnpm dev

# Production mode
pnpm start
```

Visit `http://localhost:8000/auth` to authenticate with Spotify.

## MCP Tools

The server provides three main tools:

### 🔍 `search`
Search for tracks on Spotify.

```json
{
  "tool": "search",
  "arguments": {
    "query": "Beatles Hey Jude"
  }
}
```

### 📻 `player_state`
Get current playback information.

```json
{
  "tool": "player_state",
  "arguments": {}
}
```

### 🎮 `player_control`
Control playback (play, pause, next, previous).

```json
{
  "tool": "player_control",
  "arguments": {
    "command": "play"
  }
}
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Claude    │────▶│  MCP Server │────▶│  Spotify    │
│     (AI)    │ SSE │   (Node.js) │ API │     API     │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **OAuth Handler**: Manages Spotify authentication with PKCE
- **MCP Server**: Implements Model Context Protocol with tools
- **HTTP Server**: Express server with SSE for real-time communication
- **Spotify Client**: Type-safe API client with error handling

## Development

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Testing

The project follows Test-Driven Development (TDD) practices:

- Unit tests for all components
- Integration tests for API interactions  
- 80%+ code coverage requirement
- Tests written before implementation

## Error Handling

All functions use `neverthrow` for type-safe error handling:

```typescript
const result = await searchTracks(query);
if (result.isErr()) {
  // Handle error
} else {
  // Use result.value
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD)
4. Implement functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- Uses [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- Follows [ts-guide](https://github.com/ryo-morimoto/ts-guide) conventions