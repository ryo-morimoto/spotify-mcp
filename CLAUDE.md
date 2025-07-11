# Project-Specific Instructions for Claude

## Project Overview

This is a Spotify MCP (Model Context Protocol) server that provides Spotify search capabilities to AI assistants through a type-safe, functional architecture.

## 🚨 CORE PHILOSOPHY - ABSOLUTE REQUIREMENTS 🚨

### KISS (Keep It Simple, Stupid) - MANDATORY
- **NEVER add complexity** unless absolutely necessary
- **ALWAYS choose the simplest solution** that works
- **FORBIDDEN**: Over-engineering, premature optimization, unnecessary abstractions
- **REQUIRED**: Clear, readable, straightforward code

### YAGNI (You Aren't Gonna Need It) - MANDATORY
- **NEVER implement features** that aren't currently needed
- **ALWAYS wait until a feature is actually required** before implementing it
- **FORBIDDEN**: Building for hypothetical future requirements
- **REQUIRED**: Minimal viable implementation for current needs only

### Deep Module - MANDATORY
- **NARROW INTERFACE**: Expose minimal public API surface
- **RICH FUNCTIONALITY**: Provide powerful capabilities through simple interfaces
- **HIDE COMPLEXITY**: Internal implementation details must be completely hidden
- **SIMPLE ABSTRACTIONS**: Public APIs should be intuitive and easy to understand

**Why Deep Module?** Unlike shallow modules that expose many details, deep modules reduce cognitive load by hiding complexity behind simple interfaces. This makes the codebase easier to understand and modify.

## 📋 DESIGN PRINCIPLES

### Type-Driven Development
This project follows strict type-first development:
- **Design with types first**, implement second
- **All errors must be representable as types**
- **Use Result<T, E> for all fallible operations**

**Why?** Types serve as living documentation and catch errors at compile time rather than runtime. By designing types first, we ensure our domain model is sound before writing any implementation.

### No-Exception Design
- **NEVER throw exceptions** in application code
- **ALWAYS use Result types** for error handling
- **ALL functions that can fail** must return `Result<T, E>`

**Why?** Exceptions create invisible control flow that's hard to track. Result types make error paths explicit in function signatures, forcing proper error handling and making code more predictable.

### Test-Driven Development (TDD)
Follow t-wada's TDD methodology:
1. **Red Phase**: Write a failing test first
2. **Green Phase**: Write minimum code to pass
3. **Refactor Phase**: Improve code while keeping tests green

**Why t-wada's approach?** This methodology ensures we write only the code we need (supporting YAGNI) and creates a safety net for refactoring. Tests written first tend to have better coverage and clearer intent.

## 🔧 IMPLEMENTATION RULES

### Type Design Rules

#### Use `type` over `interface`
- **ALWAYS use `type`** for all type definitions
- **NEVER use `interface`** unless absolutely necessary

**Why?** Types support union types, intersection types, and conditional types - features essential for ADT (Algebraic Data Type) patterns. Interfaces are limited to object shapes.

#### Centralized Type Definitions
- **ALL domain types in `src/types.ts`** - no exceptions
- **Import SDK types directly** - don't redefine them

**Why centralization?** Having all types in one file makes it easy to understand the domain model at a glance and prevents circular dependencies. Direct SDK imports ensure we stay in sync with upstream changes.

#### Branded Types for Domain Concepts
```typescript
// ✅ GOOD
type UserId = string & { _brand: "UserId" };

// ❌ BAD
type UserId = string;
```

**Why?** Branded types prevent mixing up semantically different values that happen to have the same primitive type (e.g., UserId vs ProductId). The compiler catches these errors.

### Error Handling Implementation

#### Result Type Usage
This project uses the **neverthrow** library for Result types:
- Import: `import { Result, ok, err } from "neverthrow"`
- Use `result.isOk()` and `result.isErr()` for type checking
- Chain operations with `map()`, `mapErr()`, `andThen()`, etc.

#### Example Pattern
```typescript
// ✅ GOOD - Returns Result
function parseJson(input: string): Result<unknown, string> {
  try {
    return ok(JSON.parse(input));
  } catch (error) {
    return err(`Failed to parse JSON: ${error}`);
  }
}

// ❌ BAD - Throws exception
function parseJsonBad(input: string): unknown {
  return JSON.parse(input); // This can throw!
}
```

### Project Structure
- **Flat structure** - no deep directory nesting
- **One function per file** matching filename
- **Test files as `*.test.ts`** alongside source files

**Why flat?** Deep nesting creates cognitive overhead when navigating files. Flat structure makes files discoverable and imports shorter. One-function-per-file enforces single responsibility.

## 📝 CODING CONVENTIONS

### File Naming
- Source files: `src/<lowerCamelCase>.ts`
- Test files: `src/<name>.test.ts`
- Always add `.ts` extension to imports

**Why .ts extensions?** Enables compatibility with Deno and native ESM, avoiding build tool lock-in.

### Import Rules
- Node.js modules use `node:` prefix (e.g., `import fs from "node:fs"`)
- External SDK types import directly (don't redefine)

**Why node: prefix?** Clearly distinguishes built-in modules from npm packages, preventing accidental shadowing by installed packages.

### Export Pattern
- Export a function that matches the filename
- Keep everything else private

**Why?** This creates a predictable API where the filename tells you exactly what's exported, supporting the Deep Module principle.

### Code Style
- Use TypeScript strict mode
- Follow existing code formatting (Biome)
- Use meaningful variable and function names
- Keep functions small and focused
- Write tests for new functionality using Vitest

### Quality Gates
- Run `pnpm check` before committing
- All lint errors must be fixed
- All tests must pass
- Do not disable lint rules without explicit user approval
- `.oxlintrc.json` must not be modified without user permission

**Why strict gates?** Broken windows theory - allowing small quality issues leads to overall degradation. Automated checks maintain consistent quality.

### Commit Message Convention
All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

#### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Supported Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

#### Examples
- `feat: add Spotify playlist search functionality`
- `fix(oauth): resolve token refresh race condition`
- `docs: update API documentation with new endpoints`
- `refactor: simplify error handling in auth module`
- `test: add integration tests for search endpoints`

**Why Conventional Commits?** Enables automated versioning, changelog generation, and provides clear commit history. The standardized format makes it easy to understand what changed and why.

## Project Structure

- `src/` - Source code
- `docs/` - Documentation
- `docs/research/` - Technical investigation results

## 📚 Documentation

### `docs/testing.md`
Mock-free testing strategy. Read when deciding what to test.

### `docs/research/`
Investigation results storage. Check date in filename for freshness, read first 10 lines for overview when reusing past research.

## 🚨 FINAL REMINDER: CRITICAL PRINCIPLES 🚨

**These principles are ABSOLUTE and NON-NEGOTIABLE:**

1. **KISS**: Every line of code MUST be as simple as possible
2. **YAGNI**: NO feature until it's actually needed
3. **DEEP MODULE**: NARROW interface with RICH functionality
4. **TYPE-FIRST**: Design with types, errors as values
5. **NO EXCEPTIONS**: Result<T, E> for everything

**Claude Code MUST enforce these principles in EVERY change, EVERY commit, and EVERY decision.**

**Violation of these principles is NOT acceptable under ANY circumstances.**