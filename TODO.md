# TODO.md - Spotify Remote MCP Server

## Project Overview
Spotify Remote MCP Server with HTTP SSE support using TypeScript, TDD, and ts-guide best practices.

## Setup Checklist

### 🎯 Initial Setup
- [ ] Run ts-guide setup: `npx -y tiged mizchi/ts-guide/docs/ts-guide ./docs/ts-guide`
- [ ] Setup Claude commands: `mkdir -p .claude/commands && npx -y tiged mizchi/ts-guide/docs/commands .claude/commands`
- [ ] Initialize with Claude: `claude "Setup this project by docs/ts-guide/_init.md. Node.js TypeScript MCP server with HTTP SSE"`
- [ ] Eject unused docs: `claude "Eject unused document by docs/ts-guide/eject.md"`

### 📦 Dependencies
- [ ] Initialize pnpm: `pnpm init --init-type module`
- [ ] Core dependencies: `pnpm add typescript vitest @vitest/coverage-v8 @types/node -D`
- [ ] MCP dependencies: `pnpm add @modelcontextprotocol/sdk express cors dotenv`
- [ ] Type definitions: `pnpm add @types/express @types/cors -D`
- [ ] Error handling: `pnpm add neverthrow`
- [ ] Tooling: `pnpm add @biomejs/biome oxlint -D`

### ⚙️ Configuration
- [ ] Create `tsconfig.json` with ESM support
- [ ] Create `vitest.config.ts` with in-source testing
- [ ] Update `package.json` scripts
- [ ] Configure `.gitignore`
- [ ] Setup environment variables template (`.env.example`)

## Development Tasks

### 🧪 Phase 1: Foundation (TDD)

#### 1.1 Project Structure
```
TodoWrite([
  {
    id: "create_structure",
    content: "Create project folder structure following ts-guide conventions",
    status: "pending",
    priority: "high",
    mode: "tdd",
    files: [
      "src/spotify_api.ts",
      "src/spotify_api.test.ts",
      "src/mcp_server.ts",
      "src/mcp_server.test.ts",
      "src/oauth_handler.ts",
      "src/oauth_handler.test.ts",
      "src/index.ts"
    ]
  }
]);
```

#### 1.2 Spotify API Client
```
TodoWrite([
  {
    id: "spotify_api_tests",
    content: "Write tests for Spotify API client",
    status: "pending",
    priority: "high",
    mode: "tdd",
    tests: [
      "searchTracks returns tracks on success",
      "searchTracks handles auth errors",
      "searchTracks handles rate limits",
      "getCurrentPlayback returns player state",
      "controlPlayback executes commands"
    ]
  },
  {
    id: "spotify_api_impl",
    content: "Implement Spotify API client with neverthrow",
    status: "blocked",
    blockedBy: ["spotify_api_tests"],
    priority: "high",
    mode: "tdd"
  }
]);
```

#### 1.3 OAuth Handler
```
TodoWrite([
  {
    id: "oauth_tests",
    content: "Write tests for OAuth PKCE flow",
    status: "pending",
    priority: "high",
    mode: "tdd",
    tests: [
      "generateCodeChallenge creates valid PKCE challenge",
      "exchangeCodeForToken returns tokens on success",
      "refreshToken updates access token",
      "validateToken checks token expiry"
    ]
  },
  {
    id: "oauth_impl",
    content: "Implement OAuth handler with PKCE",
    status: "blocked",
    blockedBy: ["oauth_tests"],
    priority: "high",
    mode: "tdd"
  }
]);
```

### 🔌 Phase 2: MCP Integration (TDD)

#### 2.1 MCP Server Core
```
TodoWrite([
  {
    id: "mcp_server_tests",
    content: "Write tests for MCP server tools",
    status: "pending",
    priority: "high",
    mode: "tdd",
    tests: [
      "search tool returns track results",
      "player_state tool returns current state",
      "player_control tool executes commands",
      "MCP server handles invalid requests"
    ]
  },
  {
    id: "mcp_server_impl",
    content: "Implement MCP server with tool definitions",
    status: "blocked",
    blockedBy: ["mcp_server_tests"],
    priority: "high",
    mode: "tdd"
  }
]);
```

#### 2.2 HTTP Server with SSE
```
TodoWrite([
  {
    id: "http_server_tests",
    content: "Write tests for HTTP/SSE server",
    status: "pending",
    priority: "high",
    mode: "tdd",
    tests: [
      "SSE endpoint establishes connection",
      "SSE streams MCP messages",
      "Health check returns 200",
      "OAuth callback handles code exchange"
    ]
  },
  {
    id: "http_server_impl",
    content: "Implement Express server with SSE support",
    status: "blocked",
    blockedBy: ["http_server_tests"],
    priority: "high",
    mode: "tdd"
  }
]);
```

### 🚀 Phase 3: Integration & Deployment

#### 3.1 Integration Tests
```
TodoWrite([
  {
    id: "integration_tests",
    content: "Write end-to-end integration tests",
    status: "pending",
    priority: "medium",
    mode: "tdd",
    tests: [
      "Full OAuth flow with token refresh",
      "MCP tool execution through SSE",
      "Error propagation through layers",
      "Concurrent request handling"
    ]
  }
]);
```

#### 3.2 Documentation
```
TodoWrite([
  {
    id: "documentation",
    content: "Create comprehensive documentation",
    status: "pending",
    priority: "medium",
    files: [
      "README.md",
      "API.md",
      "CONTRIBUTING.md",
      "docs/architecture.md"
    ]
  }
]);
```

## Test Execution Strategy

### Batch Test Running
```bash
# Run all tests in batch
Task("Test Runner", "Execute all tests with coverage", {
  mode: "tdd",
  batchOptimized: true,
  commands: [
    "pnpm test:cov",
    "pnpm typecheck",
    "pnpm lint"
  ]
});
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
- Test Coverage: 0%
- Tests Written: 0
- Tests Passing: 0
- Code Quality Score: N/A

### Milestones
- [ ] Phase 1 Complete: Foundation with 90%+ coverage
- [ ] Phase 2 Complete: MCP Integration tested
- [ ] Phase 3 Complete: Production ready

## Notes

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
