# Project Overview

Spotify MCP Server is a modern TypeScript implementation of the Model Context Protocol (MCP) for Spotify integration. It provides a secure, scalable API for AI assistants to interact with Spotify services.

## 🎯 Purpose

This server enables AI assistants to:
- Search and browse Spotify content (tracks, albums, artists, playlists)
- Control Spotify playback on user devices
- Create and manage playlists
- Get personalized recommendations
- Analyze audio features and user preferences

## 🏗️ Architecture

The server follows a modular, function-based architecture with clear separation of concerns:

```
┌─────────────────┐     ┌──────────────────┐
│   AI Assistant  │────▶│   MCP Protocol   │
└─────────────────┘     └──────────────────┘
                               │
                        ┌──────▼──────┐
                        │ Hono Server │
                        └──────┬──────┘
                               │
        ┌──────────────┬───────┴────────┬──────────────┐
        │              │                │              │
   ┌────▼────┐    ┌────▼────┐     ┌────▼────┐   ┌────▼────┐
   │  Auth   │    │   MCP   │     │ Storage │   │External │
   │ Handler │    │ Handler │     │  (D.O.) │   │   APIs  │
   └─────────┘    └─────────┘     └─────────┘   └─────────┘
```

## 🛠️ Technology Stack

### Core Technologies
- **Language**: TypeScript 5.8.3 with ES2022 target
- **Runtime**: Cloudflare Workers with Durable Objects
- **Framework**: [Hono](https://hono.dev/) v4.7.16 - Ultrafast web framework
- **Package Manager**: pnpm

### Key Dependencies
- **@modelcontextprotocol/sdk**: v1.13.0 - Official MCP implementation
- **@spotify/web-api-ts-sdk**: v1.3.2 - Official Spotify SDK
- **neverthrow**: v8.2.0 - Type-safe error handling
- **hono**: v4.7.16 - Web framework optimized for edge

### Development Tools
- **Test Runner**: Vitest 3.2.4 with in-source testing
- **Linter**: oxlint 1.2.0 with comprehensive rules
- **Formatter**: Prettier 3.5.3
- **Type Checking**: Strict TypeScript configuration

## 📋 Features

### MCP Tools
- **Search**: Find tracks, albums, artists, playlists
- **Playback Control**: Play, pause, skip, seek, volume
- **Playlist Management**: Create, modify, reorder playlists
- **Recommendations**: Get personalized suggestions
- **Audio Analysis**: Analyze track features (tempo, energy, etc.)
- **Device Management**: List and control playback devices

### MCP Resources
- **Track Information**: Detailed track metadata
- **Album Details**: Album tracks and metadata
- **Artist Profiles**: Artist information and top tracks
- **Playlist Contents**: Playlist tracks and metadata
- **User Profile**: Current user information

### MCP Prompts
- **Discover by Mood**: Find music matching specific moods
- **Analyze Taste**: Understand user's music preferences
- **Create Playlist**: Generate playlists with AI assistance
- **Organize Music**: Manage and categorize music library

## 🔐 Security

- **OAuth 2.0 with PKCE**: Secure authorization without client secrets
- **Token Management**: Automatic refresh with Durable Objects
- **Session Isolation**: Per-user session management
- **No Exception Policy**: All errors handled with Result types

## 🚀 Performance

- **Edge Deployment**: Runs on Cloudflare's global network
- **Minimal Latency**: Optimized for edge computing
- **Efficient Caching**: Smart caching strategies
- **Type Safety**: Full TypeScript coverage prevents runtime errors

## 📦 Deployment

The server is designed for Cloudflare Workers deployment:
- **Serverless**: No infrastructure management
- **Global**: Runs at edge locations worldwide
- **Scalable**: Automatic scaling with demand
- **Persistent Storage**: Durable Objects for session data

## 🔗 Integration

Integrates seamlessly with:
- **Claude Desktop**: Native MCP support
- **Windsurf IDE**: Built-in MCP integration
- **Custom Applications**: Via MCP SDK
- **HTTP Clients**: Standard JSON-RPC over HTTP

---

For detailed setup instructions, see [Development Setup](./development-setup.md).
For API documentation, see [API Reference](./api-reference.md).