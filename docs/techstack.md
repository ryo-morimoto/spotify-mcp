# Project Overview

This project uses the following stack:

## Core Technologies
- **Language**: TypeScript 5.8+
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm

## Build Configuration
- **TypeScript**: Strict mode enabled with noUnusedLocals and noUnusedParameters
- **Module System**: ESM modules
- **Module Resolution**: Bundler mode with .ts extension imports allowed

## Testing
- **Test Runner**: Vitest
- **Coverage**: V8 provider
- **Test Pattern**: Separate test files (`*.test.ts`)

## Code Quality
- **Linter**: oxlint (Rust-based, zero-config linter)
- **Formatter**: Biome (all-in-one toolchain)

## Error Handling
- **Strategy**: neverthrow library for Result types
- **Policy**: No exceptions in application code

## Project Structure
- **Source Code**: `src/` directory with lowerCamelCase naming
- **Tests**: Colocated as `*.test.ts` files
- **Documentation**: `docs/` directory
- **CI/CD**: GitHub Actions workflow

## Development Workflow
- **Pre-commit Check**: `pnpm check` (runs typecheck, test, format:check, and lint)
- **Code Style**: Function-based architecture (no classes)
- **Imports**: Node.js modules use `node:` prefix

---

*This project was bootstrapped from [ts-guide](https://github.com/mizchi/ts-guide) and ejected on 2025-07-07.*