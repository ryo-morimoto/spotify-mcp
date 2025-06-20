# TODO.md - Spotify Remote MCP Server

## Project Overview

Spotify Remote MCP Server with HTTP SSE support using TypeScript, TDD, and ts-guide best practices.

## Setup Checklist

### 🎯 Initial Setup

- [ ] Initialize with Claude: `claude "Setup this project by docs/ts-guide/_init.md. Node.js TypeScript MCP server with HTTP SSE"`
- [ ] Eject unused docs: `claude "Eject unused document by docs/ts-guide/eject.md"`

### 📦 Dependencies

### ⚙️ Configuration

## Development Tasks

### 🧪 Phase 1: Foundation (TDD)

#### 1.1 Project Structure

- [ ] Create project folder structure following ts-guide conventions
  - `src/spotify_api.ts`
  - `src/spotify_api.test.ts`
  - `src/mcp_server.ts`
  - `src/mcp_server.test.ts`
  - `src/oauth_handler.ts`
  - `src/oauth_handler.test.ts`
  - `src/index.ts`

#### 1.2 Spotify API Client

- [ ] Write tests for Spotify API client
  - [ ] searchTracks returns tracks on success
  - [ ] searchTracks handles auth errors
  - [ ] searchTracks handles rate limits
  - [ ] getCurrentPlayback returns player state
  - [ ] controlPlayback executes commands
- [ ] Implement Spotify API client with neverthrow (blocked by: spotify_api_tests)

#### 1.3 OAuth Handler

- [ ] Write tests for OAuth PKCE flow
  - [ ] generateCodeChallenge creates valid PKCE challenge
  - [ ] exchangeCodeForToken returns tokens on success
  - [ ] refreshToken updates access token
  - [ ] validateToken checks token expiry
- [ ] Implement OAuth handler with PKCE (blocked by: oauth_tests)

### 🔌 Phase 2: MCP Integration (TDD)

#### 2.1 MCP Server Core

- [ ] Write tests for MCP server tools
  - [ ] search tool returns track results
  - [ ] player_state tool returns current state
  - [ ] player_control tool executes commands
  - [ ] MCP server handles invalid requests
- [ ] Implement MCP server with tool definitions (blocked by: mcp_server_tests)

#### 2.2 HTTP Server with SSE

- [ ] Write tests for HTTP/SSE server
  - [ ] SSE endpoint establishes connection
  - [ ] SSE streams MCP messages
  - [ ] Health check returns 200
  - [ ] OAuth callback handles code exchange
- [ ] Implement Express server with SSE support (blocked by: http_server_tests)

### 🚀 Phase 3: Integration & Deployment

#### 3.1 Integration Tests

- [ ] Write end-to-end integration tests
  - [ ] Full OAuth flow with token refresh
  - [ ] MCP tool execution through SSE
  - [ ] Error propagation through layers
  - [ ] Concurrent request handling

#### 3.2 Documentation

- [ ] Create comprehensive documentation
  - `README.md`
  - `API.md`
  - `CONTRIBUTING.md`
  - `docs/architecture.md`

## Test Execution Strategy

### Batch Test Running

```bash
# Run all tests in batch
pnpm test:cov
pnpm typecheck
pnpm lint
```

### Continuous Testing

```bash
# Watch mode for TDD

pnpm vitest --watch
```

## Quality Gates

### Pre-commit Checks

- [ ] All tests passing: `pnpm test`
- [ ] Type checking: `pnpm typecheck`
- [ ] Linting: `pnpm lint`
- [ ] Format: `pnpm format`
- [ ] Coverage > 80%: `pnpm test:cov`

### CI/CD Pipeline

- [ ] GitHub Actions workflow
- [ ] Automated testing on PR
- [ ] Coverage reporting
- [ ] Deployment pipeline

## Progress Tracking

### Metrics

- Test Coverage: 66.12%
- Tests Written: 0
- Tests Passing: 0
- Code Quality Score: N/A

### Milestones

- [ ] Phase 1 Complete: Foundation with 90%+ coverage
- [ ] Phase 2 Complete: MCP Integration tested
- [ ] Phase 3 Complete: Production ready

## Notes


## TODO

- [x] Research Cloudflare Workers MCP requirements and limitations
- [x] Check SSE compatibility with Cloudflare Workers
- [x] Create wrangler.toml for Cloudflare Workers configuration
- [x] Adapt Express server to Cloudflare Workers format
- [x] Implement KV storage for OAuth tokens
- [ ] Deploy to Cloudflare Workers and verify functionality
- [x] Update commit command to clarify internal-only changes don't need version bump
- [x] Add /memory command for documenting repeated problem solutions
- [x] Add /compact command for context window optimization
- [x] Add vim to disallowed_tools in user settings
### TDD Workflow

1. Write failing test
2. Implement minimal code to pass
3. Refactor with confidence
4. Repeat

### neverthrow Pattern

- Always return `Result<T, E>`
- Handle errors explicitly
- No try-catch in business logic
- Type-safe error handling

### ts-guide Conventions

- snake_case for filenames
- In-source testing with vitest
- ESM modules only
- Strict TypeScript

---
Generated: 2025-06-20
Mode: SPARC TDD
Tools: vitest, oxlint, TypeScript, neverthrow