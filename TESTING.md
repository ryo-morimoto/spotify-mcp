# Testing Strategy

## Overview

This document defines the testing strategy for the Spotify MCP Server project. Our goal is to achieve high confidence in code quality while maintaining development velocity.

## Testing Principles

1. **Test What Matters**: Focus on business logic and critical paths
2. **TDD Where Valuable**: Use Test-Driven Development for complex logic
3. **Avoid Testing the Framework**: Don't test external libraries or SDKs
4. **Pragmatic Coverage**: Aim for quality over quantity
5. **Fast Feedback**: Tests should run quickly

## When to Use TDD

### ✅ Always Use TDD For:
- **Business Logic**: Complex algorithms, data transformations
- **Error Handling**: Edge cases and error scenarios
- **New Features**: Start with user scenarios as tests
- **Bug Fixes**: Write failing test first, then fix
- **Exploratory Code**: Use tests to explore and validate ideas
- **Prototypes**: Tests help clarify requirements and design

### Example: Exploratory TDD
```typescript
// Starting with a user scenario helps explore the design
it('should recommend songs based on user mood', async () => {
  // This test helps us think about the API design
  const recommendations = await recommendByMood('happy');
  expect(recommendations).toHaveLength(10);
  expect(recommendations[0]).toHaveProperty('energy');
});
```

### ⚠️ Skip Unit Tests For:
- **Simple Wrappers**: Thin layers over external APIs (test via integration)
- **Pure Type Definitions**: No runtime behavior
- **Configuration Files**: Static data
- **Re-exports**: Simple module organization

## Test Categories

### 1. Unit Tests (Priority: HIGH)

**What to Test:**
- Business logic and algorithms
- Error handling and edge cases
- Data transformations
- Pure functions

**Coverage Goals:**
- Core business logic: >90%
- Utility functions: >80%
- Error handlers: >90%

**Examples:**
- `src/mcp/tools/*` - MCP tool implementations
- `src/auth/tokens.ts` - Token validation logic
- `src/result.ts` - Error handling utilities

### 2. Integration Tests (Priority: MEDIUM)

**What to Test:**
- Module interactions
- API endpoint behavior
- Database/storage operations
- Authentication flows

**Coverage Goals:**
- API routes: >80%
- Auth flows: >70%
- Storage operations: >70%

**Examples:**
- `src/routes/*.test.ts` - HTTP endpoint tests
- `src/mcp/server.test.ts` - MCP server integration

### 3. What NOT to Test

**Skip Testing:**
- External SDK wrappers (e.g., `src/external/spotify/client.ts`)
- Simple re-exports (`index.ts` files)
- Type definitions
- Configuration files
- Logging statements

**Low Priority:**
- Worker entry points (`worker.ts`)
- Middleware that delegates to libraries
- Simple getters/setters

## Module-Specific Guidelines

### `src/external/*` - External Service Wrappers
- **Test**: Error mapping logic only
- **Skip**: SDK method calls, simple wrappers
- **Reason**: These are tested via integration tests

### `src/mcp/*` - MCP Implementation
- **Test**: All tool handlers, server logic
- **Goal**: >90% coverage
- **Reason**: Core business logic

### `src/auth/*` - Authentication
- **Test**: Token validation, PKCE generation, scope checking
- **Goal**: >80% coverage
- **Reason**: Security-critical

### `src/routes/*` - HTTP Routes
- **Test**: Request/response handling, error cases
- **Goal**: >80% coverage
- **Reason**: API contract validation

### `src/types/*` - Type Definitions
- **Skip**: Pure type definitions
- **Test**: Type guard functions, validators

## Testing Best Practices

### 1. TDD Workflow

#### Traditional TDD (Known Requirements)
```typescript
// Step 1: Write failing test
it('should calculate discount correctly', () => {
  const result = calculateDiscount(100, 0.2);
  expect(result).toBe(80);
});

// Step 2: Implement minimum code to pass
function calculateDiscount(price: number, discount: number): number {
  return price * (1 - discount);
}

// Step 3: Refactor with confidence
```

#### Exploratory TDD (Discovering Design)
```typescript
// Step 1: Start with user scenario
it('should create playlist from current mood and preferences', async () => {
  const playlist = await createMoodPlaylist({
    mood: 'energetic',
    duration: 30, // minutes
    preferences: { avoidExplicit: true }
  });
  
  expect(playlist.tracks).toHaveLength(8); // ~8 songs for 30 min
  expect(playlist.averageEnergy).toBeGreaterThan(0.7);
});

// Step 2: Let the test drive the interface design
// Step 3: Iterate on both test and implementation
```

### 2. Test Structure
```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should handle error case', () => {
      // Test error scenarios
    });
  });
});
```

### 2. Mocking Guidelines
- Mock external services (Spotify API, network calls)
- Don't mock internal modules unless necessary
- Use dependency injection for testability

### 3. Test Data
- Use factory functions for test data
- Keep test data realistic
- Avoid magic numbers/strings

## Coverage Targets

### Overall Goals
- **Total Coverage**: 70% (pragmatic target)
- **Critical Paths**: >90%
- **New Code**: >80%

### Current Status
- Total: 55.22% ✓ (Acceptable)
- MCP Core: 94.77% ✓ (Excellent)
- Auth: 72.88% ✓ (Good)
- Routes: 82.25% ✓ (Good)

### Action Items
1. ✅ Maintain high coverage on MCP tools
2. ✅ Keep auth and routes well-tested
3. ⚠️ Add tests for `errorMapper.ts` only from `external/spotify`
4. ❌ No need to test thin SDK wrappers

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run specific module
pnpm test src/mcp/

# Watch mode for TDD
pnpm vitest --watch
```

## Continuous Integration

- All PRs must pass tests
- Coverage should not decrease significantly
- Focus on testing new business logic

## Decision Record

### Why 70% Overall Coverage?
- Pragmatic balance between confidence and effort
- Focus on high-value tests
- Avoid testing external dependencies

### Why Skip External Module Tests?
- Thin wrappers provide little test value
- Covered by integration tests
- Would mostly test mocks, not real behavior

### Why High Coverage for MCP?
- Core business logic
- Complex state management
- Critical for application functionality