# Project-Specific Instructions for Claude

## 🚨 CRITICAL DESIGN PRINCIPLES - MUST BE FOLLOWED AT ALL TIMES 🚨

### KISS (Keep It Simple, Stupid) - MANDATORY RULE
- **NEVER add complexity** unless absolutely necessary
- **ALWAYS choose the simplest solution** that works
- **FORBIDDEN**: Over-engineering, premature optimization, unnecessary abstractions
- **REQUIRED**: Clear, readable, straightforward code

### YAGNI (You Aren't Gonna Need It) - MANDATORY RULE  
- **NEVER implement features** that aren't currently needed
- **ALWAYS wait until a feature is actually required** before implementing it
- **FORBIDDEN**: Building for hypothetical future requirements
- **REQUIRED**: Minimal viable implementation for current needs only

**⚠️ THESE PRINCIPLES ARE ABSOLUTE AND NON-NEGOTIABLE ⚠️**

## 📋 PRIORITY DESIGN PRINCIPLE - DEEP MODULE

### Deep Module - MUST BE ENFORCED
- **NARROW INTERFACE**: Expose minimal public API surface
- **RICH FUNCTIONALITY**: Provide powerful capabilities through simple interfaces
- **HIDE COMPLEXITY**: Internal implementation details must be completely hidden
- **SIMPLE ABSTRACTIONS**: Public APIs should be intuitive and easy to understand

#### Deep Module Rules:
1. **Minimize Exports**: Only export what is absolutely necessary
2. **Single Entry Points**: Prefer one well-designed function over multiple specialized ones
3. **Internal Complexity OK**: Complex implementation is acceptable if the interface remains simple
4. **Information Hiding**: Never leak implementation details through the interface

#### Example Pattern:
```typescript
// ✅ GOOD - Deep Module: Simple interface, rich functionality
export function processData(input: string): Result<ProcessedData, Error> {
  // Complex internal logic hidden behind simple interface
}

// ❌ BAD - Shallow Module: Many exports, leaky abstractions
export class DataProcessor { ... }
export interface ProcessorConfig { ... }
export type ProcessorOptions = { ... }
export function validateInput(...) { ... }
export function transformData(...) { ... }
export function formatOutput(...) { ... }
```

## Error Handling Policy

This project follows a strict no-exceptions design policy:

- **NEVER throw exceptions** in application code
- **ALWAYS use Result types** for error handling instead of throwing
- **ALL functions that can fail** must return `Result<T, E>` instead of throwing
- Use explicit error handling over implicit exception propagation

### Result Type Implementation

This project uses the **neverthrow** library for Result types:

- Import: `import { Result, ok, err } from "neverthrow"`
- Use `result.isOk()` and `result.isErr()` for type checking
- Chain operations with `map()`, `mapErr()`, `andThen()`, etc.

### Mandatory Practices

1. **Function Return Types**: All functions that can fail must return `Result<SuccessType, ErrorType>`
2. **Error Checking**: Always use `result.isOk()` / `result.isErr()` for type-safe error checking
3. **No Exception Throwing**: Never use `throw` statements in application code
4. **Async Operations**: Return `Promise<Result<T, E>>` for async functions that can fail
5. **External Libraries**: Wrap third-party code that might throw using try-catch and return Result

### Example Pattern

```typescript
import { Result, ok, err } from "neverthrow";

// ✅ Good - Returns Result
function parseJson(input: string): Result<unknown, string> {
  try {
    return ok(JSON.parse(input));
  } catch (error) {
    return err(`Failed to parse JSON: ${error}`);
  }
}

// ❌ Bad - Throws exception
function parseJsonBad(input: string): unknown {
  return JSON.parse(input); // This can throw!
}
```

## Coding Rules

- File naming convention: `src/<lowerCamelCase>.ts`
- Add tests in `src/*.test.ts` for `src/*.ts`
- Use functions and function scope instead of classes
- Add `.ts` extension to imports for deno compatibility
- Do not disable any lint rules without explicit user approval
- Export a function that matches the filename, keep everything else private
- All lint errors must be fixed before committing code
- .oxlintrc.json must not be modified without user permission
- When importing Node.js standard library modules, use the `node:` namespace prefix (e.g., `import path from "node:path"`, `import fs from "node:fs"`)
- **IMPORTANT**: Always run `pnpm check` before committing to ensure all tests pass and code meets quality standards

## Development Workflow - Test-Driven Development (TDD)

This project follows **t-wada's TDD methodology**:

### TDD Cycle (Red-Green-Refactor)
1. **Red Phase**: Write a failing test first
2. **Green Phase**: Write the minimum code to make the test pass
3. **Refactor Phase**: Improve the code while keeping tests green

### TDD Rules (MUST BE FOLLOWED)
- **NEVER write production code** without a failing test
- **Write the simplest test** that could possibly fail
- **Write the minimum code** to pass the test
- **Refactor only when tests are green**
- **One test at a time** - don't write multiple tests before implementation

### Example TDD Flow
```typescript
// Step 1: RED - Write failing test
test("parseNumber returns ok for valid number", () => {
  const result = parseNumber("123");
  expect(result.isOk()).toBe(true);
  expect(result.value).toBe(123);
});

// Step 2: GREEN - Minimal implementation
function parseNumber(input: string): Result<number, string> {
  return ok(123); // Simplest code to pass
}

// Step 3: REFACTOR - Improve implementation
function parseNumber(input: string): Result<number, string> {
  const num = Number(input);
  if (isNaN(num)) {
    return err("Invalid number");
  }
  return ok(num);
}
```

## Code Style and Conventions

- Use TypeScript strict mode
- Follow the existing code formatting (Biome)
- Use meaningful variable and function names
- Keep functions small and focused
- Write tests for new functionality using Vitest

## Project Structure

- `src/` - Source code
- `docs/` - Documentation
- Tests are separate files: `src/*.test.ts` for each `src/*.ts`

## Technical Research Documents

Technical investigation results are stored in the `docs/research/` directory. This includes:
- MCP Protocol specifications and implementation patterns
- Technology evaluations and comparisons
- Architecture decision backgrounds

## 🚨 FINAL REMINDER: CRITICAL DESIGN PRINCIPLES 🚨

**KISS and YAGNI are ABSOLUTE REQUIREMENTS for this project:**

1. **KISS**: Every line of code MUST be as simple as possible
2. **YAGNI**: NO feature should be implemented until it's actually needed
3. **DEEP MODULE**: Every module MUST have a narrow interface with rich functionality

**Claude Code MUST enforce these principles in EVERY change, EVERY commit, and EVERY decision.**

**Violation of these principles is NOT acceptable under ANY circumstances.**