# 🎵 Spotify MCP Server

A modern Model Context Protocol (MCP) server that enables AI assistants to control Spotify playback through secure JSON-RPC communication. Built with Hono for high performance and modular architecture.

📚 **[Complete Documentation](docs/spec/)** | 🏗️ **[Architecture Guide](docs/spec/system-overview.md)** | 🔧 **[API Reference](docs/api-reference.md)**

## ✨ Features

- 🎵 **Full Spotify Control**: Search tracks, control playback, and get current playing status
- 🔐 **Secure Authentication**: OAuth 2.0 with PKCE flow for secure Spotify access
- 🔌 **Standard Protocol**: JSON-RPC over HTTP for MCP communication
- 🤖 **MCP Protocol**: Compatible with Claude and other MCP-enabled AI assistants
- 📚 **MCP Resources**: Access Spotify data through resource URLs (planned)
- 💬 **MCP Prompts**: Pre-built workflows for music discovery (planned)
- 🌐 **Global Distribution**: Cloudflare Workers deployment with edge computing
- 🛠️ **Type Safety**: Full TypeScript with neverthrow error handling

## 🚀 Quick Start

### 📎 Prerequisites

- Node.js 18+ and pnpm
- Spotify Developer account
- Spotify Premium account (for playback control)

### 💾 Installation

```bash
# Clone the repository
git clone https://github.com/ryo-morimoto/spotify-mcp.git
cd spotify-mcp

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### ⚙️ Configuration

1. Create a Spotify App at [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Add `http://127.0.0.1:8000/callback` to Redirect URIs
   > **🚨 Note**: Spotify requires `127.0.0.1` for local development, not `localhost`
3. Create `.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here  # Optional for PKCE
PORT=8000
```

### 🏃 Running the Server

```bash
# Development mode with hot reload
pnpm dev

# Production mode
pnpm start

# Type checking + tests
pnpm check
```

Visit `http://127.0.0.1:8000/auth` to authenticate with Spotify.

## MCP Tools

The server currently implements three core tools, with [detailed specifications](docs/spec/components/mcp/tools/) available:

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

### 📚 MCP Resources (Planned)

Access Spotify data through resource URLs. See [resource specifications](docs/spec/components/mcp/resources/) for detailed design:

```
@spotify-remote:spotify://user/playlists
@spotify-remote:spotify://playlist/{playlistId}
@spotify-remote:spotify://track/{trackId}
@spotify-remote:spotify://now-playing
```

### 💬 MCP Prompts (Planned)

Pre-built workflows for music discovery. See [prompt specifications](docs/spec/components/mcp/prompts/) for detailed templates:

```
/mcp__spotify_remote__discover_music "indie rock, dreamy"
/mcp__spotify_remote__create_playlist "Chill Vibes" "lo-fi, jazz"
/mcp__spotify_remote__mood_playlist "focus"
/mcp__spotify_remote__analyze_taste
```

### 🔧 Additional Tools (Documented)

The following tools are fully specified in [docs/spec/components/mcp/tools/](docs/spec/components/mcp/tools/) but not yet implemented:

- `playlist_create` - Create new Spotify playlists
- `recommendations` - Get personalized track suggestions  
- `audio_features` - Analyze track characteristics
- `playlist_modify` - Modify existing playlists
- `devices` - Manage playback devices

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Claude    │────▶│  MCP Server │────▶│  Spotify    │
│  Assistant │ MCP │    (Hono)   │ API │  Web API    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 🔌 System Components

- **🌐 External Integrations** (`external/spotify/`): Spotify Web API operations (使うAPI)
  - 🔧 Public interface: `external/spotify/index.ts`
- **🔐 Authentication** (`auth/`): OAuth PKCE and token management
  - 🔧 Public interface: `auth/index.ts`
- **🤖 MCP Protocol** (`mcp/`): Transport-agnostic MCP implementation
  - 🔧 Public interface: `mcp/index.ts`
  - Tools, resources, and prompts for Spotify control
- **🛣️ HTTP Routes** (`routes/`): API endpoint handlers
  - 🔧 Public interface: `routes/index.ts`
  - OAuth flow: `/auth`, `/callback`
  - MCP endpoint: `/mcp` (JSON-RPC)
  - Health check: `/health`
- **🌐 HTTP Server** (`server.ts`): Hono server with middleware
- **💾 Token Storage** (`storage/`): Durable Objects for token persistence
  - 🔧 Public interface: `storage/index.ts`
- **🔌 Adapters** (`adapters/`): Environment-specific token managers
  - 🔧 Public interface: `adapters/index.ts`
- **⚙️ Middleware** (`middleware/`): Auth, session, error handling, timing
  - 🔧 Public interface: `middleware/index.ts`
- **📝 Types** (`types/`): Centralized TypeScript definitions
  - 🔧 Public interface: `types/index.ts`
- **☁️ Cloudflare Workers** (`worker.ts`): Edge deployment with Durable Objects

## 📈 Development Status

### ✅ Current Implementation
- ✅ **Modern Stack**: Hono framework with TypeScript and neverthrow
- ✅ **Security**: OAuth PKCE authentication with automatic token refresh
- ✅ **MCP Tools**: search, player_state, player_control with type safety
- ✅ **HTTP Server**: JSON-RPC endpoint for MCP protocol
- ✅ **Deployment**: Cloudflare Workers with Durable Objects storage
- ✅ **Testing**: TDD practices with comprehensive test coverage
- ✅ **Architecture**: Modular design with clear API boundaries

### 🚧 Planned Features
- 🚧 **MCP Resources**: spotify://user/playlists, spotify://track/{id}, etc.
- 🚧 **MCP Prompts**: discover_music, create_playlist, mood_playlist
- 🚧 **Advanced Tools**: Playlist management, recommendations, audio features
- 🚧 **Durable Objects**: Token storage with auto-refresh alarms

## 🛠️ Development

### 🔄 Core Commands
```bash
# Essential development workflow
pnpm check           # Type checking + tests (before commits)
pnpm test            # Run all tests
pnpm test:cov        # Coverage report (aim for >80%)
pnpm vitest --watch  # TDD watch mode

# Code quality
pnpm typecheck       # TypeScript verification
pnpm lint            # ESLint checking
pnpm format          # Prettier formatting
```

### 🎯 Testing Strategy
```bash
# Module-specific testing
pnpm vitest run src/external/          # External API tests
pnpm vitest run src/api/               # Exposed API tests
pnpm vitest -t "searchTracks"          # Pattern matching

# Integration testing
pnpm test:server                       # Server functionality
pnpm test:integration                  # End-to-end tests
```

### 📋 Task Management

This project uses `pcheck` for structured TODO management:

```bash
pcheck               # View all TODO items
pcheck --code        # Include code comments (TODO/FIXME)
pcheck u             # Update completed tasks
pcheck add -m "task" # Add new task
pcheck check <id>    # Toggle completion
```

**Claude Commands** for development workflow:
```bash
/todo-format         # Format TODO.md for pcheck
/code-todo-format    # Format code TODOs
/commit              # Smart commits with checks
```

## 🧪 Testing Philosophy

Follows **Test-Driven Development (TDD)** with strict quality standards:

- 🎯 **Unit Tests**: All components with >80% coverage
- 🔗 **Integration Tests**: Real API interactions and workflows
- 🔄 **TDD Workflow**: Test-first development cycle
- 📉 **Coverage Tracking**: Detailed reports with `pnpm test:cov`
- 🔍 **Vitest Framework**: Modern testing with in-source tests

## 🚫 Error Handling

**No-Exceptions Policy** using `neverthrow` for type safety:

```typescript
// All functions return Result<T, E> instead of throwing
const result = await searchTracks(query);
if (result.isErr()) {
  console.error(result.error);  // Explicit error handling
} else {
  console.log(result.value);    // Type-safe success value
}

// Chain operations safely
const pipeline = await searchTracks(query)
  .andThen(tracks => playTrack(tracks[0]))
  .map(response => response.status);
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