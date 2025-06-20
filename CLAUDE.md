# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spotify Remote MCP Server - A TypeScript MCP (Model Context Protocol) server for controlling Spotify, with HTTP SSE support. The project follows TDD (Test-Driven Development) practices and ts-guide conventions.

## Development Commands

### Essential Commands
```bash
pnpm typecheck        # Type checking with TypeScript
pnpm test            # Run all tests
pnpm test:cov        # Run tests with coverage report
pnpm check           # Run typecheck + tests (use before commits)
pnpm vitest --watch  # Watch mode for TDD development
```

### Running Single Tests
```bash
pnpm vitest run src/spotifyApi.test.ts  # Run specific test file
pnpm vitest -t "searchTracks"            # Run tests matching pattern
```

## Architecture & Structure

### Project Layout
```
src/
├── spotifyApi.ts      # Spotify Web API client with neverthrow
├── oauthHandler.ts    # OAuth PKCE flow implementation
├── mcpServer.ts       # MCP server with tool definitions
└── index.ts            # HTTP server with SSE support
```

## Coding Rules

- File naming convention: `src/<lowerCamelCase>.ts`
- Add tests in `src/*.test.ts` for `src/*.ts` or in `test/*.test.ts`
- Use functions and function scope instead of classes
- Add `.ts` extension to imports for deno compatibility. Example: `import {} from "./x.ts"`
- Do not disable any lint rules without explicit user approval
- Export a function that matches the filename, and keep everything else as private as possible

## Additional Prompt

In our project, do not throw exceptions. Use neverthrow instead of throwing.

## Design Policy

This project follows a no-exceptions design policy:

- Do not throw exceptions in application code
- Use Result types for error handling instead of throwing
- Prefer explicit error handling over implicit exception propagation
- Choose between neverthrow library or custom Result type implementation
- All functions that can fail should return Result<T, E> instead of throwing

### Key Design Patterns

1. **Error Handling**: Uses `neverthrow` for type-safe error handling
   - All functions return `Result<T, E>` instead of throwing
   - Explicit error handling without try-catch in business logic

2. **Testing**: In-source testing with Vitest
   - Test files use `.test.ts` suffix or `if (import.meta.vitest)` blocks
   - TDD workflow: Write failing test → Implement → Refactor

3. **File Naming**: lowerCamelCase convention (e.g., `spotifyApi.ts`)

### MCP Tools Implementation

The server implements these MCP tools:
- `search`: Search for tracks on Spotify
- `player_state`: Get current playback state
- `player_control`: Control playback (play, pause, next, etc.)

## TypeScript MCP Integration

**CRITICAL**: When refactoring TypeScript code, ALWAYS use typescript MCP tools:

- **Rename symbols**: Use `mcp__typescript__rename_symbol` (NOT Edit/Write)
- **Move files**: Use `mcp__typescript__move_file` (NOT Bash mv)
- **Move directories**: Use `mcp__typescript__move_directory`
- **Find references**: Use `mcp__typescript__find_references` (NOT Grep)
- **Type analysis**: Use `mcp__typescript__get_type_*` tools

## Development Workflow

### TDD Process
1. Write failing test first
2. Implement minimal code to pass
3. Refactor with confidence
4. All implementations must have tests

### Quality Checks Before Commits
```bash
pnpm check           # Must pass before any commit
pnpm test:cov       # Aim for >80% coverage
```

### OAuth Flow
The server implements Spotify OAuth with PKCE (Proof Key for Code Exchange):
- Generates code challenge for authorization
- Exchanges authorization code for tokens
- Handles token refresh automatically

### SSE (Server-Sent Events)
HTTP server streams MCP messages through SSE endpoint for real-time communication with clients.

## Dependencies Context

- **@modelcontextprotocol/sdk**: MCP server implementation
- **express**: HTTP server with SSE support
- **neverthrow**: Type-safe error handling
- **vitest**: Testing framework with in-source testing
- **typescript-mcp**: TypeScript language server for refactoring

## Environment Variables

Create `.env` file based on `.env.example`:
- `SPOTIFY_CLIENT_ID`: Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify app client secret (if not using PKCE)
- `PORT`: Server port (default: 3000)

## Current Status

The project is in early development phase. Check `TODO.md` for:
- Current implementation status
- Test coverage metrics
- Phase-based development plan
- TDD task tracking
