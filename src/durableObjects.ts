import { tokenStore } from './tokenStore.ts';

// TokenManager Durable Object class (required by Cloudflare)
// NOTE: Classes are required here by Cloudflare Workers runtime
// This is the only place where we use classes in the codebase
// Reference: https://developers.cloudflare.com/durable-objects/
export class TokenManager {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    // TODO: Add request middleware [LOW]
    // - [ ] Log all requests for debugging
    // - [ ] Add request timing metrics
    // - [ ] Implement request retry logic
    // Context: Improve observability for Durable Object requests
    return tokenStore(this.state, request);
  }
}

// SessionManager Durable Object class (placeholder for future use)
// TODO: Implement session management [MID]
// - [ ] Track active MCP connections
// - [ ] Store user preferences
// - [ ] Manage connection state across reconnects
// - [ ] Implement session timeout handling
// Purpose: Enable persistent sessions across reconnections
export class SessionManager {
  constructor(_state: DurableObjectState) {
    // Initialize when needed
  }

  async fetch(_request: Request): Promise<Response> {
    // FIXME: Implement actual session management [MID]
    // - [ ] Store WebSocket/SSE connections
    // - [ ] Track connection state and metadata
    // - [ ] Handle reconnection logic
    // - [ ] Parse session ID from request
    // - [ ] Store/retrieve session data
    // - [ ] Handle session expiration
    // Blocked by: Full MCP SSE implementation
    return new Response('Session manager not implemented', { status: 501 });
  }
}
