// Cloudflare Workers environment types

interface Env {
  // KV Namespaces
  OAUTH_TOKENS: KVNamespace;

  // Secrets
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET?: string;

  // Durable Objects
  TOKEN_MANAGER: DurableObjectNamespace;
  SESSION_MANAGER?: DurableObjectNamespace;

  // Environment variables
  PORT?: string;
  MCP_VERSION?: string;
  LOG_LEVEL?: string;
  ENVIRONMENT?: string;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}
