# Test Helpers

This directory contains test helper utilities following the project's testing conventions.

## MockKVNamespace

A mock implementation of Cloudflare's KVNamespace for testing.

### Features

- **In-memory storage** - Uses Map for fast, simple storage
- **TTL support** - Handles `expirationTtl` with automatic expiration
- **Call tracking** - Uses Vitest mocks to track method calls
- **Inspection methods** - Direct access to stored values without triggering mocks
- **Time manipulation** - `advanceTime()` method for testing TTL behavior

### Usage

```typescript
import { createMockKV, createMockKVWithData } from "./mockKV.ts";

// Create empty mock
const mockKV = createMockKV();

// Create with initial data
const mockKV = createMockKVWithData({
  key1: "value1",
  key2: { value: "value2", ttl: 60 }, // 60 seconds TTL
});

// Use in tests
await mockKV.put("key", "value", { expirationTtl: 3600 });
const value = await mockKV.get("key");

// Verify calls
expect(mockKV.put).toHaveBeenCalledWith("key", "value", { expirationTtl: 3600 });

// Inspect without triggering mocks
const storedValue = mockKV.getStoredValue("key");

// Test TTL expiration
mockKV.advanceTime(3601000); // Advance 3601 seconds
```

See `mockKV.example.test.ts` for complete usage examples.