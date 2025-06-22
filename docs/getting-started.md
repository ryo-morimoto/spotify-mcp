# Getting Started with Spotify MCP Server

This guide will help you get the Spotify MCP Server running quickly for AI-assisted Spotify control.

## What is Spotify MCP Server?

Spotify MCP Server implements the Model Context Protocol (MCP) to enable AI assistants like Claude to control your Spotify playback, search for music, manage playlists, and more. It acts as a bridge between AI assistants and the Spotify Web API.

## Quick Start (5 minutes)

### Prerequisites

- Node.js 20+ and pnpm installed
- Spotify account (free or premium)
- [Spotify Developer Account](https://developer.spotify.com/dashboard) (free)

### Step 1: Clone and Install

```bash
git clone https://github.com/ryo-morimoto/spotify-mcp.git
cd spotify-mcp
pnpm install
```

### Step 2: Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **"Create app"**
3. Fill in:
   - **App name**: `My Spotify MCP`
   - **Description**: `Personal Spotify MCP Server`
   - **Redirect URI**: `http://127.0.0.1:8000/callback`
4. Check **"Web API"**
5. Click **"Save"**
6. Copy your **Client ID** from the app settings

### Step 3: Configure Environment

Create a `.env` file in the project root:

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
```

That's it! No client secret needed (we use PKCE flow).

### Step 4: Start the Server

```bash
pnpm dev
```

Server starts at `http://127.0.0.1:8000`

### Step 5: Authenticate with Spotify

1. Open your browser to: `http://127.0.0.1:8000/auth`
2. Log in to Spotify and authorize the app
3. You'll be redirected back with "Authentication successful!"

### Step 6: Connect Your AI Assistant

#### For Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spotify": {
      "command": "curl",
      "args": [
        "-N",
        "-H", "Accept: text/event-stream",
        "http://127.0.0.1:8000/sse"
      ]
    }
  }
}
```

Restart Claude Desktop after saving.

#### For Windsurf IDE

1. Open Windsurf
2. Go to Settings → MCP Servers
3. Add server with URL: `http://127.0.0.1:8000/sse`

## Try It Out!

Once connected, you can ask your AI assistant to:

### 🎵 Music Search
- "Search for songs by The Beatles"
- "Find jazz playlists"
- "Show me Taylor Swift's latest album"

### ▶️ Playback Control
- "Play music"
- "Pause the current song"
- "Skip to the next track"
- "Set volume to 50%"

### 📋 Playlist Management
- "Create a new playlist called 'Workout Mix'"
- "Add this song to my playlist"
- "Show my playlists"

### 🎯 Smart Features
- "Play something upbeat"
- "Find music similar to what's playing"
- "Analyze the current track's audio features"

## Common Issues

### "No active device found"

**Solution**: Open Spotify on any device (phone, desktop, web) and play something first. The device will then be available for control.

### "Authentication failed"

**Solution**: 
1. Check your Client ID in `.env` matches Spotify app
2. Ensure redirect URI is exactly `http://127.0.0.1:8000/callback`
3. Try re-authenticating at `http://127.0.0.1:8000/auth`

### "Cannot connect to MCP server"

**Solution**:
1. Ensure server is running (`pnpm dev`)
2. Check no other service is using port 8000
3. Verify Claude Desktop config is correct
4. Restart Claude Desktop after config changes

## What's Next?

### Explore More Features

Check out the full list of available tools:
```bash
# View all MCP tools
curl http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

### Deploy to Production

Ready to access your Spotify from anywhere? See the [Deployment Guide](./deployment-guide.md) for Cloudflare Workers deployment.

### Customize and Extend

- Add new MCP tools in `src/mcp/tools/`
- Modify prompts in `src/mcp/prompts/`
- See [Development Setup](./development-setup.md) for details

### Run Tests

Ensure everything works correctly:
```bash
pnpm test
```

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/ryo-morimoto/spotify-mcp/issues)
- 💬 [Discussions](https://github.com/ryo-morimoto/spotify-mcp/discussions)
- 📚 [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api/)

## Security Notes

- Tokens are stored in memory (local dev) or Durable Objects (production)
- OAuth uses PKCE flow - no client secret needed
- Each user's tokens are isolated
- Tokens auto-refresh before expiration

---

**Enjoy controlling Spotify with AI!** 🎵🤖