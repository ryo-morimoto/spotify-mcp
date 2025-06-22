# Spotify External API Module

## Overview

Clean interface to the Spotify Web API using `@spotify/web-api-ts-sdk` with consistent error handling via `neverthrow` Result types.

## Module Structure

```
src/external/spotify/
├── client.ts       # Spotify client factory
├── search.ts       # Track search functionality
├── player.ts       # Playback control and state
├── errorMapper.ts  # SDK error to domain error mapping
├── index.ts        # Public module interface
└── README.md       # This file
```

## Design Principles

1. **Single Responsibility**: One function per file, matching filename
2. **Function-First**: No classes, only pure functions
3. **Result Types**: All APIs return `Result<T, E>` for explicit error handling
4. **Consistent Patterns**: Unified error handling across all functions

## Implementation Pattern

### Required Pattern

All Spotify API functions **MUST** follow this pattern:

```typescript
export async function functionName(
  client: SpotifyApi,
  param1: Type1,
  param2?: Type2
): Promise<Result<ReturnType, NetworkError | AuthError | SpotifyError>> {
  try {
    const result = await client.namespace.method(param1, param2);
    return ok(result.someProperty);
  } catch (error) {
    // Handle special cases internally if needed
    // e.g., 204 for getCurrentPlayback, type casting for player methods
    return err(mapSpotifyError(error));
  }
}
```

### Anti-Patterns to Avoid

```typescript
// ❌ BAD: Throwing errors instead of returning Result
export async function searchTracks(client: SpotifyApi, query: string) {
  const results = await client.search(query, ['track']);
  if (!results) throw new Error("No results");
  return results;
}

// ❌ BAD: Inconsistent error handling inline
export async function getCurrentPlayback(client: SpotifyApi) {
  try {
    return await client.player.getPlaybackState();
  } catch (error: any) {
    if (error.status === 401) {
      throw new Error('Unauthorized');
    }
    // Inconsistent - sometimes throw, sometimes return
    return null;
  }
}
```

### Error Mapping

The SDK throws standard JavaScript `Error` objects with:
- `status`: HTTP status code
- `message`: Error description

Our `errorMapper.ts` converts these to domain errors:
- **401, 403** → `AuthError`
- **400, 404, 429, 4xx** → `SpotifyError`
- **5xx, network** → `NetworkError`

### Implementation Notes

Each function handles its own special cases internally:

- **204 No Content**: Handle in functions that may receive it (e.g., `getCurrentPlayback`)
- **Empty arrays**: Return as-is, let consumers decide how to handle
- **Type casting**: Keep it local to the function that needs it
- **Optional fields**: Use optional chaining (`?.`) and defaults at the usage site

Keep special case handling inside each function. Don't create new abstractions unless absolutely necessary.

#### Example: Handling 204 in getCurrentPlayback
```typescript
export async function getCurrentPlayback(
  client: SpotifyApi
): Promise<Result<PlayerState | null, NetworkError | AuthError | SpotifyError>> {
  try {
    const state = await client.player.getPlaybackState();
    return ok(state);
  } catch (error) {
    // 204 handling is local to this function
    if ((error as unknown as { status?: number }).status === 204) {
      return ok(null);
    }
    return err(mapSpotifyError(error));
  }
}
```

## Usage Examples

### Search Tracks
```typescript
import { createSpotifyClient } from './client.ts';
import { searchTracks } from './search.ts';

const client = createSpotifyClient(accessToken);
const result = await searchTracks(client, "query", 10);

if (result.isErr()) {
  // Handle error based on type
  console.error(result.error);
}
```

### Player Control
```typescript
import { getCurrentPlayback, controlPlayback } from './player.ts';

const state = await getCurrentPlayback(client);
if (state.isOk() && state.value?.is_playing) {
  await controlPlayback(client, 'pause');
}
```

## Adding New Functions

1. Create new file: `src/external/spotify/{feature}.ts`
2. Follow the required pattern above
3. Export from `index.ts`
4. Add tests following existing patterns

## Testing

- **Unit Tests**: Mock `SpotifyApi` client
- **Error Cases**: Test all HTTP status codes
- **Type Safety**: Verify Result types

## Future Enhancements

- [ ] Caching for frequently accessed data
- [ ] Retry logic with exponential backoff
- [ ] Request/response logging
- [ ] Pagination support