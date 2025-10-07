> [!WARNING]
> Spotify has been added to the ChatGPT apps, so I will archive this project.

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
```

### Configuration

1. Create a Spotify App at [developer.spotify.com](https://developer.spotify.com/dashboard)
2. Create `wrangler.toml` from the existing example in the repository
3. Set up Cloudflare KV namespace and environment secrets

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

### Search
- **search_tracks**
- **search_artists**
- **search_albums**
- **search_playlists**
- **search_shows**
- **search_episodes**
- **search_audiobooks**

### Albums
- **get_album**
- **get_several_albums**
- **get_album_tracks**
- **get_saved_albums**
- **save_albums**
- **remove_saved_albums**
- **check_saved_albums**

### Artists
- **get_artist**
- **get_several_artists**
- **get_artist_albums**
- **get_artist_top_tracks**
- **get_related_artists**

### Tracks
- **get_track**
- **get_several_tracks**
- **get_track_audio_analysis**

### Playlists
- **get_playlist**
- **get_playlist_items**
- **get_playlist_cover_image**
- **create_playlist**
- **change_playlist_details**
- **add_items_to_playlist**
- **update_playlist_items**
- **remove_playlist_items**
- **add_custom_playlist_cover_image**
- **get_current_user_playlists**
- **get_user_playlists**
- **get_featured_playlists**
- **get_category_playlists**

### Player
- **get_playback_state**
- **get_currently_playing_track**
- **get_recently_played_tracks**
- **get_available_devices**
- **get_user_queue**
- **start_resume_playback**
- **pause_playback**
- **skip_to_next**
- **skip_to_previous**
- **seek_to_position**
- **set_repeat_mode**
- **set_playback_volume**
- **toggle_playback_shuffle**
- **transfer_playback**
- **add_item_to_playback_queue**

### Library
- **get_saved_tracks**
- **save_tracks**
- **remove_saved_tracks**
- **check_saved_tracks**

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
