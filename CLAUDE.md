# Project-Specific Instructions for Claude

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