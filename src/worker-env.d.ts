// Cloudflare Workers environment types

interface Env {
  // KV Namespaces
  OAUTH_TOKENS: KVNamespace;
  
  // Secrets
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET?: string;
  
  // Durable Objects
  SESSION_MANAGER?: DurableObjectNamespace;
  
  // Environment variables
  PORT?: string;
  MCP_VERSION?: string;
  LOG_LEVEL?: string;
  ENVIRONMENT?: string;
}