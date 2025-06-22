# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MCP Resources implementation (in progress)
- MCP Prompts implementation (in progress)
- Tool output schemas (in progress)

## Development Progress

### Added
- Complete Spotify Web API client implementation with neverthrow error handling
- OAuth PKCE flow with token refresh functionality
- MCP server with three core tools: search, player_state, player_control
- MCP capabilities for resources and prompts (implementation pending)
- Cloudflare Workers deployment support with Durable Objects
- Comprehensive test suite with 67% coverage
- HTTP server with SSE endpoint (full MCP protocol pending)
- Token storage with auto-refresh functionality
- Integration with @modelcontextprotocol/sdk

### Changed
- Updated port configuration to standardize on 8000 for Spotify callback requirements
- Enhanced error handling throughout the application
- Added version field to package.json (0.2.0)

### Fixed
- Port inconsistencies across configuration files
- Missing LICENSE file
- Package.json missing name and version fields
- Documentation accuracy for SSE implementation status

## [0.0.0] - 2025-01-20

### Added
- Initial project setup with TypeScript and ts-guide conventions
- MCP (Model Context Protocol) server foundation
- Spotify Web API integration planning
- OAuth PKCE flow implementation structure
- HTTP server with SSE (Server-Sent Events) support
- Error handling with neverthrow library
- Comprehensive documentation (CLAUDE.md, TODO.md, ROADMAP.md)
- Development tooling configuration (vitest, oxlint, prettier)
- TDD (Test-Driven Development) workflow setup

### Changed
- Updated file naming convention from snake_case to lowerCamelCase in documentation

[0.0.0]: https://github.com/ryo-morimoto/spotify-mcp/releases/tag/v0.0.0