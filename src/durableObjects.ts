import { tokenStore } from './tokenStore.ts';

// TokenProvider Durable Object class (required by Cloudflare)
// NOTE: Classes are required here by Cloudflare Workers runtime
// This is the only place where we use classes in the codebase
// Reference: https://developers.cloudflare.com/durable-objects/
export class TokenProvider {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    // NOTE: Middleware concerns should be handled at the Worker level, not here
    // This is a thin wrapper that delegates to tokenStore
    return tokenStore(this.state, request);
  }
}

