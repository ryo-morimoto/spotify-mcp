# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

Spotify Remote MCP Server - A modern TypeScript MCP (Model Context Protocol) server for Spotify integration with JSON-RPC over HTTP. Built with Hono, following TDD practices, modular architecture, and strict coding conventions.

## 🛠️ Development Commands

### Essential Commands
```bash
pnpm typecheck        # Type checking with TypeScript
pnpm test            # Run all tests
pnpm test:cov        # Run tests with coverage report
pnpm check           # Run typecheck + tests (use before commits)
pnpm vitest --watch  # Watch mode for TDD development
pcheck --code        # View all TODO/FIXME comments in code
```

### Claude Commands
```bash
/todo-format         # Format TODO.md files for pcheck
/code-todo-format    # Format TODO/FIXME comments in code for pcheck
/code-annotations    # Manage all code annotations comprehensively
/commit              # Smart git commits with quality checks
```

### Running Single Tests
```bash
pnpm vitest run src/external/spotify/search.test.ts  # Run specific test file
pnpm vitest -t "searchTracks"                         # Run tests matching pattern
pnpm vitest run src/api/                              # Run all exposed API tests
pnpm vitest run src/external/                         # Run all external integration tests
```

## 🏗️ Architecture & Structure

### Project Layout
```
src/
├── external/          # External API integrations (使うAPI)
│   └── spotify/       # Spotify Web API functions
│       ├── index.ts           # Module public interface
│       └── {api-name}.ts      # Spotify Api description
├── routes/            # HTTP route handlers (Hono)
│   ├── index.ts       # Route exports
│   ├── auth.ts        # OAuth endpoints (/auth, /callback)
│   ├── mcp.ts         # MCP JSON-RPC endpoint (/mcp)
│   └── health.ts      # Health check (/health)
├── mcp/                   # MCP protocol implementation (transport-agnostic)
│   ├── index.ts           # Module public interface
│   ├── server.ts          # MCP server core logic
│   ├── tools/
│   │   ├── index.ts           # Module public interface
│   │   └── {tool-name}.ts     # Tool registration & execution
│   ├── resources/
│   │   ├── index.ts           # Module public interface
│   │   └── {resource-name}.ts       # Resource handlers
│   └── prompts/
│       ├── index.ts           # Module public interface
│       └── {prompt-name}.ts         # Prompt templates
├── auth/              # Authentication logic (domain)
│   ├── index.ts       # Module public interface
│   ├── spotify.ts     # Spotify OAuth implementation
│   ├── pkce.ts        # PKCE utilities
│   └── tokens.ts      # Token management
├── types/             # Centralized type definitions
│   ├── index.ts       # Main type exports
│   ├── spotify.ts     # Spotify API types
│   ├── oauth.ts       # OAuth & authentication types
│   ├── storage.ts     # Storage layer types
│   └── token.ts       # Token management types
├── middleware/        # Hono middleware modules
│   └── index.ts       # Middleware exports
├── storage/           # Data persistence layer
│   └── index.ts       # Storage exports
├── adapters/          # Integration adapters
│   └── index.ts       # Adapter exports
├── server.ts          # Main Hono HTTP server
├── worker.ts          # Cloudflare Workers entry point
├── durableObjects.ts  # Cloudflare Workers Durable Objects
└── result.ts          # Centralized error handling
```

## 📏 Coding Rules

- **File naming convention**: 
  - External integrations: `src/external/{service}/{function}.ts` (使うAPI)
  - Authentication logic: `src/auth/{function}.ts` (domain logic)
  - MCP protocol: `src/mcp/{component}/{function}.ts` (transport-agnostic)
  - HTTP routes: `src/routes/{endpoint}.ts` (Hono handlers)
  - Other files: `src/<lowerCamelCase>.ts`
- **Declarative structure**: Organize by domain and function rather than technical layers
- **Single responsibility**: Each file exports one main function matching the filename
- **Function-first**: Use functions and function scope instead of classes
- **Deno compatibility**: Add `.ts` extension to imports. Example: `import {} from "./x.ts"`
- **Test placement**: Add tests in `src/**/*.test.ts` alongside implementation files
- **Strict linting**: Do not disable any lint rules without explicit user approval

## 🚫 Error Handling Policy

**CRITICAL**: Do not throw exceptions. Use neverthrow Result types instead of throwing.

## 🎨 Design Patterns

### Core Principles

1. **No-Exceptions Policy**
   - Use Result types for error handling instead of throwing
   - All functions that can fail should return `Result<T, E>`
   - Explicit error handling without try-catch in business logic

2. **Module + Function Architecture** 
   - Each file exports a main function matching the filename
   - Use namespaces for internal organization
   - Keep implementation details private

3. **Type Safety**
   - Centralized type definitions in `src/types/`
   - Explicit return type annotations
   - neverthrow Result types for error handling

4. **Test-Driven Development**
   - Test files use `.test.ts` suffix
   - TDD workflow: Write failing test → Implement → Refactor
   - Aim for >80% test coverage

### 🔌 MCP Implementation

The server provides a flexible MCP (Model Context Protocol) implementation:

- **Tools**: Dynamic tool registration for Spotify operations
- **Resources**: URL-based access to Spotify data and metadata  
- **Prompts**: Pre-built workflows and command templates
- **JSON-RPC**: Standard MCP protocol over HTTP POST

**Architecture**: Modular design allows easy extension of MCP capabilities without breaking existing functionality.

## 🔧 TypeScript MCP Integration

**CRITICAL**: When refactoring TypeScript code, ALWAYS use TypeScript MCP tools:

- **Rename symbols**: Use `mcp__typescript__rename_symbol` (NOT Edit/Write)
- **Move files**: Use `mcp__typescript__move_file` (NOT Bash mv)  
- **Move directories**: Use `mcp__typescript__move_directory`
- **Find references**: Use `mcp__typescript__find_references` (NOT Grep)
- **Type analysis**: Use `mcp__typescript__get_type_*` tools

## 🚀 Development Workflow

### TDD Process
1. Write failing test first (`*.test.ts`)
2. Implement minimal code to pass
3. Refactor with confidence using TypeScript MCP tools
4. All implementations must have comprehensive tests

### Quality Checks
```bash
pnpm check           # Must pass before any commit
pnpm test:cov       # Aim for >80% coverage
pnpm typecheck       # Type safety verification
```

### 🔐 Authentication Flow
- **OAuth PKCE**: Secure authorization flow without client secrets
- **Token Management**: Automatic refresh with Durable Objects storage
- **Session Management**: Secure session handling for API access

### 📡 MCP Communication  
- **JSON-RPC Protocol**: Standard MCP implementation over HTTP POST
- **Request/Response**: Synchronous tool execution and results
- **Error Handling**: Proper JSON-RPC error responses

## 📦 Tech Stack

- **@modelcontextprotocol/sdk**: Official MCP server implementation
- **@spotify/web-api-ts-sdk**: Official Spotify Web API TypeScript SDK
- **hono**: High-performance web framework for HTTP APIs
- **neverthrow**: Type-safe error handling with Result types
- **vitest**: Modern testing framework with in-source testing
- **typescript-mcp**: TypeScript language server for refactoring

## 🌍 Environment Setup

Create `.env` file based on `.env.example`:
```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret  # Optional for PKCE
PORT=8000                                  # Required for Spotify callback
```

**Note**: Port 8000 is required by Spotify's OAuth callback restrictions.

## 📊 Current Status

This is a modern, production-ready MCP server. Check `TODO.md` for:
- 🎯 Implementation roadmap
- 🧪 Test coverage metrics (Current: 45.17%)
- ☁️ Cloudflare deployment status
- 🔧 Refactoring progress
