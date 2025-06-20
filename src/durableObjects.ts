import { tokenStore } from './tokenStore.ts';

// TokenManager Durable Object class (required by Cloudflare)
export class TokenManager {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    return tokenStore(this.state, request);
  }
}

// SessionManager Durable Object class (placeholder for future use)
export class SessionManager {
  constructor(_state: DurableObjectState) {
    // Initialize when needed
  }

  async fetch(_request: Request): Promise<Response> {
    return new Response('Session manager not implemented', { status: 501 });
  }
}
