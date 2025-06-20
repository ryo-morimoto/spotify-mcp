# Project Overview

This project uses the following stack:

## Core Technologies
- **Language**: TypeScript 5.8.3 with ES2022 target
- **Runtime**: Node.js 20+ (ESM modules)
- **Package Manager**: pnpm
- **Framework**: MCP (Model Context Protocol) SDK v1.13.0

## Build Configuration
- **TypeScript**: Strict mode enabled with all checks
- **Module System**: ESM with bundler resolution
- **Output**: ES2022 modules with incremental compilation

## Testing
- **Test Runner**: Vitest 3.2.4 with in-source testing
- **Coverage**: V8 coverage reporting
- **Pattern**: TDD (Test-Driven Development)

## Code Quality
- **Linter**: oxlint 1.2.0 with comprehensive ESLint-style rules
- **Formatter**: Prettier 3.5.3 (100 char width, single quotes)
- **Type Checking**: Strict TypeScript with no implicit any

## Error Handling
- **Strategy**: neverthrow 8.2.0 for Result types
- **Custom Types**: NetworkError, AuthError, ValidationError, SpotifyError
- **Policy**: No exceptions in business logic

## Key Dependencies
- **express**: v5.1.0 - HTTP server with SSE support
- **typescript-mcp**: v0.0.12 - TypeScript language server integration

## Project Structure
- **Naming Convention**: lowerCamelCase for files (e.g., `spotifyApi.ts`)
- **Architecture**: Function-based (no classes)
- **Import Style**: Explicit `.ts` extensions for Deno compatibility

---

*This project was bootstrapped from [ts-guide](https://github.com/mizchi/ts-guide) and ejected on 2025-06-19.*