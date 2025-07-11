import type {
  TextContent,
  ResourceContents,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type { KVNamespace } from "@cloudflare/workers-types";

// Tool handler return type
export type ToolResult = {
  content: Array<TextContent | ResourceContents>;
  isError?: boolean;
};

// Spotify track type for search results
export type SpotifyTrackResult = {
  id: string;
  name: string;
  artists: string;
  album: string;
  duration_ms: number;
  preview_url: string | null;
  external_url: string;
};

// Spotify-specific constants
export const SPOTIFY_TRACK_MIME_TYPE = "application/x-spotify-track" as const;

// Branded types for Spotify
export type SpotifyClientId = string & { _brand: "SpotifyClientId" };
export type SpotifyAccessToken = string & { _brand: "SpotifyAccessToken" };
export type SpotifyRefreshToken = string & { _brand: "SpotifyRefreshToken" };

// Spotify client configuration
export type SpotifyConfig = {
  clientId: SpotifyClientId;
  redirectUri: string;
  accessToken: SpotifyAccessToken;
  refreshToken?: SpotifyRefreshToken;
  expiresAt?: number;
};

// Tool definition type
export type ToolDefinition<TSchema extends z.ZodRawShape> = {
  name: string;
  title: string;
  description: string;
  inputSchema: TSchema;
  handler: (input: z.infer<z.ZodObject<TSchema>>) => Promise<CallToolResult>;
};

// OAuth types
export type OAuthState = {
  codeVerifier: string;
  state: string;
  redirectUri: string;
  mcpSession?: string; // Optional MCP session ID
};

export type TokenResponse = {
  accessToken: SpotifyAccessToken;
  refreshToken: SpotifyRefreshToken;
  expiresIn: number;
};

// Cloudflare Worker bindings
export type Bindings = {
  CLIENT_ID: string;
  OAUTH_KV: KVNamespace;
  SPOTIFY_REDIRECT_URI: string;
  CORS_ORIGIN?: string;
};
