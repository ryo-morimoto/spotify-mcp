# TODO.md - Spotify Remote MCP Server

## Project Overview

Spotify Remote MCP Server for Cloudflare Workers with OAuth PKCE authentication, using TypeScript, TDD, and modular architecture.

## 🎯 Project Setup

### Initial Setup
- [x] Initialize TypeScript project with Hono and MCP SDK
- [x] Configure for Cloudflare Workers deployment
- [ ] Remove legacy ts-guide documentation
- [x] Remove SSE implementation (routes/sse.ts) - focus on JSON-RPC only

## 🏗️ Core Implementation

### Spotify API Integration
- [x] Implement Spotify API client with neverthrow
  - [x] searchTracks with error handling
  - [x] getCurrentPlayback for player state
  - [x] controlPlayback for playback commands
- [ ] Extend Spotify API features
  - [ ] Add playlist management support
  - [ ] Implement track recommendations
  - [ ] Add audio features analysis

### OAuth & Authentication
- [x] Implement OAuth PKCE flow
  - [x] generateCodeChallenge for PKCE
  - [x] exchangeCodeForToken implementation
  - [x] refreshToken mechanism
  - [x] validateToken functionality
- [x] Implement Durable Objects for token storage
  - [x] TokenStore Durable Object with auto-refresh
  - [ ] AuthState Durable Object for PKCE state
  - [x] Alarm-based token refresh before expiry
- [x] [MID] Add authentication middleware for routes
  - [x] Basic auth middleware with token validation
  - [x] requireAuth for protected routes
  - [x] optionalAuth for optional authentication
  - [x] requireScopes for OAuth scope validation
- [x] [MID] Implement exponential backoff for token refresh failures
- [x] Support authorization code flow with state parameter validation
- [x] Add OAuth scope validation helpers
- [ ] Enhance token security
  - [ ] Encrypt tokens at rest using Web Crypto API
  - [ ] Implement token rotation on refresh
  - [ ] Add token usage auditing
  - [ ] Support token revocation

### MCP Server Implementation
- [x] Implement basic MCP server with tools
  - [x] search tool for track search
  - [x] player_state tool for current state
  - [x] player_control tool for playback control
- [ ] Add MCP Resources (planned)
  - [ ] spotify://user/playlists
  - [ ] spotify://playlist/{playlistId}
  - [ ] spotify://track/{trackId}
  - [ ] spotify://now-playing
- [ ] Add MCP Prompts (planned)
  - [ ] discover_music prompt
  - [ ] create_playlist prompt
  - [ ] mood_playlist prompt
  - [ ] analyze_taste prompt
- [ ] Improve MCP JSON-RPC Implementation
  - [ ] Generate tool schemas from Zod definitions automatically
  - [ ] Add proper input validation for tool parameters
  - [ ] Implement rate limiting per client
  - [ ] Add request ID tracking for debugging
  - [ ] Support JSON-RPC notifications properly
  - [ ] Add WebSocket support for bidirectional communication
- [x] [CRITICAL] Implement MCP JSON-RPC endpoint ⚠️ PRIMARY PROTOCOL
  - [x] Create /mcp endpoint to replace SSE implementation
  - [x] Request/response pattern over HTTP POST
  - [x] Proper error handling and status codes
  - [x] Support for batched requests (MAY requirement)
  - [x] Remove SSE implementation (routes/sse.ts)
- [ ] Add advanced MCP tools
  - [ ] playlist_create and playlist_modify
  - [ ] recommendations tool
  - [ ] devices management
  - [ ] user_profile tool

### HTTP Server & Routes
- [x] Implement Hono server with routes
  - [x] OAuth endpoints (/auth, /callback)
  - [x] Health check endpoint (/health)
  - [x] MCP JSON-RPC endpoint (/mcp) - PRIMARY
  - [x] ~~SSE endpoint (/sse)~~ - REMOVED
- [ ] Add middleware enhancements
  - [ ] Request validation
  - [ ] Authentication middleware
  - [ ] Rate limiting
  - [ ] Add comprehensive request validation
    - [ ] Validate all incoming MCP requests
    - [ ] Implement rate limiting per user/IP
    - [ ] Add request signing for authenticity
    - [ ] Prevent request replay attacks

## ☁️ Cloudflare Deployment

### Infrastructure Setup
- [x] Research Cloudflare Workers MCP requirements
- [x] Check SSE compatibility with Cloudflare Workers
- [x] Create wrangler.toml configuration
- [x] Adapt Express server to Workers format
- [x] Implement KV storage for OAuth tokens
- [x] Implement Durable Objects for token storage with auto-refresh

### Production Deployment
- [ ] Deploy to Cloudflare Workers and verify functionality
  - [x] Configure Durable Objects bindings (implemented in wrangler.toml)
  - [ ] Set up environment variables (SPOTIFY_CLIENT_ID, WORKER_URL)
  - [ ] Test OAuth PKCE flow in production
  - [ ] Verify MCP JSON-RPC endpoint (not yet implemented)
  - [ ] Test token auto-refresh with Durable Objects

### Performance Optimization
- [ ] Monitor CPU time limits
- [ ] Optimize bundle size
- [ ] Implement caching strategies

## 🧪 Testing & Quality

### Test Coverage
- [x] Unit tests for core modules (Current: 45.17%)
  - [x] Spotify API tests (70.73%)
  - [x] OAuth handler tests (72.18%)
  - [x] MCP server tests (95.92%)
  - [x] Token store tests (87.27%)
  - [x] Route handlers tests (100% - MCP and OAuth routes tested)
  - [x] Middleware tests (Auth middleware 100% tested)
  - [ ] Worker/Durable Objects tests (0%)
- [ ] Integration tests
  - [ ] Full OAuth flow with token refresh
  - [ ] MCP tool execution through JSON-RPC
  - [ ] Error propagation through layers
  - [ ] Concurrent request handling
- [ ] Coverage > 80%: `pnpm test:cov`

### Code Quality
- [x] Type checking: `pnpm typecheck`
- [x] Linting: `pnpm lint`
- [x] Formatting: `pnpm format`
- [ ] Set up pre-commit hooks
- [ ] Configure CI/CD pipeline

## 📚 Documentation

### Project Documentation
- [x] Basic README.md
- [ ] Comprehensive API documentation
- [ ] Architecture documentation
- [ ] Deployment guide updates
- [ ] Contributing guidelines

### Developer Tools
- [x] Update commit command for version bumping
- [x] Add /memory command for problem solutions
- [x] Add /compact command for context optimization
- [x] Add vim to disallowed_tools

## 🚀 CI/CD & Deployment

### Automation
- [ ] Create GitHub Actions workflow
  - [ ] Run tests on pull requests
  - [ ] Type checking and linting
  - [ ] Coverage reporting to Codecov
- [ ] Configure Cloudflare deployment pipeline
  - [ ] Auto-deploy to staging on main branch
  - [ ] Manual promotion to production
- [ ] Add security scanning for dependencies

### Monitoring & Observability
- [ ] Error monitoring setup
- [ ] Performance monitoring
- [ ] Security audit
- [ ] Load testing
- [ ] Add application telemetry
  - [ ] Track MCP tool usage metrics
  - [ ] Monitor API response times
  - [ ] Add custom metrics for business logic
  - [ ] Integrate with monitoring platforms
- [ ] Implement structured logging
  - [ ] Add request/response logging
  - [ ] Include correlation IDs for tracing
  - [ ] Support log aggregation
  - [ ] Add log level configuration

## 📊 Progress Tracking

### Development Phases
- [x] Phase 1: Core implementation with OAuth and basic MCP
- [ ] Phase 2: Full MCP protocol and advanced features
- [ ] Phase 3: Production deployment and monitoring

### Technical Debt
- [x] ~~Remove 'any' types in mcpServer.ts~~ (Fixed with proper type schemas)
- [ ] Improve error handling consistency
  - [ ] Create custom error classes for different error types
  - [ ] Implement error recovery strategies
  - [ ] Add error telemetry and monitoring
  - [ ] Create error documentation for API consumers
- [ ] Add request validation middleware
- [ ] Implement proper logging system

## 🚀 Advanced Features

### Multi-User Support
- [ ] Support multiple Spotify accounts
  - [ ] Add account switching functionality
  - [ ] Store tokens per account
  - [ ] Support family/business accounts
  - [ ] Add account linking/unlinking
- [ ] Implement proper user identification
  - [ ] Extract user ID from authentication token
  - [ ] Support multiple Spotify accounts per user
  - [ ] Add user session management

### Performance Optimizations
- [ ] Implement request batching for Spotify API
  - [ ] Batch multiple search requests
  - [ ] Combine player state queries
  - [ ] Reduce API call overhead
  - [ ] Implement request deduplication

### Offline Capabilities
- [ ] Add offline capabilities
  - [ ] Cache recently played tracks
  - [ ] Queue commands for later execution
  - [ ] Sync state when reconnected
  - [ ] Handle conflicting updates

### Advanced Testing
- [ ] Add end-to-end testing
  - [ ] Test full OAuth flow
  - [ ] Verify MCP protocol compliance
  - [ ] Test error scenarios
  - [ ] Add performance benchmarks
- [ ] Implement contract testing
  - [ ] Define contracts for Spotify API
  - [ ] Test MCP protocol contracts
  - [ ] Add consumer-driven contracts
  - [ ] Automate contract verification

## 🔧 Refactoring Plan

### Modular Architecture Refactoring (COMPLETED) ✅
- [x] Phase 1: Create directory structure for modular architecture
  - [x] Create `src/external/spotify/` directory for 使うAPI (already existed)
  - [x] Create `src/auth/` directory for authentication domain logic
  - [x] Create `src/routes/` directory for HTTP route handlers
  - [x] Create `src/mcp/` directory with tools/, resources/, prompts/ subdirectories (transport-agnostic)
- [x] Phase 2: Reorganize existing files into proper modules
  - [x] ~~Move `spotifyApi.ts` → `external/spotify/`~~ (kept for legacy support)
  - [x] Move `oauthHandler.ts` → `auth/` and split into spotify.ts, pkce.ts, tokens.ts
  - [x] Move `mcpServer.ts` → `mcp/server.ts` and decompose tools/, resources/, prompts/
  - [x] Create route handlers in `routes/` for auth.ts, mcp.ts, health.ts
- [x] Phase 3: Add index.ts public interfaces to all modules
  - [x] ~~Create `external/spotify/index.ts`~~ (already existed)
  - [x] Create `auth/index.ts` with public exports
  - [x] Create `mcp/index.ts` with public exports
  - [x] Create `routes/index.ts` with route exports
  - [x] Add missing index.ts to middleware/, storage/, adapters/
- [x] Phase 4: Convert class-based implementations to function-first
  - [x] Refactor `InMemoryTokenStorage` class to functions
  - [x] Refactor `TokenManagerAdapter` class to functions
  - [x] Update all imports to use module index.ts files
- [x] Phase 5: Ensure single responsibility and naming conventions
  - [x] Each file exports one main function matching the filename
  - [x] Use namespace pattern for internal organization
  - [x] Verify all files follow lowerCamelCase naming

### Hono Migration (Completed)
- [x] Phase 1: Add Hono dependency and create basic setup
- [x] Phase 2: Migrate all routes to Hono
- [x] Phase 3: Integrate MCP SDK with Hono
- [x] Phase 4: Remove Express dependencies

### Architecture Improvements
- [ ] Implement connection pooling
  - [ ] Reuse HTTP connections to Spotify API
  - [ ] Implement connection health checks
  - [ ] Add connection timeout handling
  - [ ] Monitor connection metrics
- [ ] Add caching layer
  - [ ] Implement LRU cache for search results
  - [ ] Cache user profile and preferences
  - [ ] Add cache invalidation strategies
  - [ ] Support distributed caching for Cloudflare Workers
- [ ] Create abstraction for storage backends
- [ ] Design plugin system for tools
  - [ ] Define plugin interface
  - [ ] Support custom MCP tools via plugins
  - [ ] Add plugin discovery mechanism
  - [ ] Implement plugin sandboxing
- [ ] Implement dependency injection pattern
  - [ ] Create service container for managing dependencies
  - [ ] Remove direct imports in favor of injected dependencies
  - [ ] Support testing with mock implementations
  - [ ] Add lifecycle management for services

---

## 📋 Metrics

- Test Coverage: 45.17%
- Architecture: Modular (✅ Refactored)
- Core Features: Implemented
- Cloudflare Ready: Yes (Durable Objects implemented)
- MCP Protocol: JSON-RPC endpoint implemented ✅


## TODO

### High Priority - Architecture Alignment
- [x] CRITICAL: Implement modular architecture as specified in CLAUDE.md ✅
  - [x] Create external/spotify/ directory structure for 使うAPI
  - [x] Create auth/ directory for authentication domain logic
  - [x] Create routes/ directory for HTTP endpoints
  - [x] Create mcp/ directory for transport-agnostic MCP protocol
  - [x] Add index.ts public interfaces to all modules
  - [x] Convert class-based implementations to function-first pattern
- [x] Refactor: Split monolithic files (oauthHandler.ts, mcpServer.ts) into focused modules
- [x] Refactor: Ensure single responsibility - one main function per file
- [x] Refactor: Fix file naming to follow lowerCamelCase convention

### Medium Priority - Code Quality
- [ ] Refactor: Standardize error handling patterns across codebase
- [ ] Refactor: Add explicit types for API responses and standardize formats
- [ ] Refactor: Optimize import statements to use module index.ts files
- [ ] Refactor: Remove undocumented files (spotifyApiSdk.ts) or document their purpose

### Low Priority - Documentation
- [ ] Document spotifyApiSdk.ts purpose or remove if unused
- [ ] Add comprehensive inline documentation
- [ ] Update API documentation with actual endpoints

### Completed
- [x] URGENT: Delete Express implementation completely - src/index.ts and src/index.test.ts
- [x] Refactor: Clean up Express dependencies and consolidate to Hono-only
- [x] Migrate from Express to Hono framework
- [x] Implement Durable Objects for token storage with auto-refresh
- [x] Implement modular architecture as specified in CLAUDE.md
- [x] Split monolithic files into focused modules
- [x] Convert class-based implementations to function-first pattern
- [x] Add index.ts public interfaces to all modules