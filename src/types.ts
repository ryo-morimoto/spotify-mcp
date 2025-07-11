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

// Spotify album type for search results
export type SpotifyAlbumResult = {
  id: string;
  name: string;
  artists: string;
  release_date: string;
  total_tracks: number;
  album_type: string;
  external_url: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
};

// Spotify artist type for search results
export type SpotifyArtistResult = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: number;
  external_url: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
};

// Spotify playlist type for search results
export type SpotifyPlaylistResult = {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  public: boolean | null;
  collaborative: boolean;
  total_tracks: number;
  external_url: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
};

// Spotify show (podcast) type for search results
export type SpotifyShowResult = {
  id: string;
  name: string;
  description: string;
  publisher: string;
  total_episodes: number;
  explicit: boolean;
  external_url: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
};

// Spotify episode type for search results
export type SpotifyEpisodeResult = {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  release_date: string;
  explicit: boolean;
  external_url: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
};

// Spotify audiobook type for search results
export type SpotifyAudiobookResult = {
  id: string;
  name: string;
  description: string;
  authors: string[];
  narrators: string[];
  publisher: string;
  total_chapters: number;
  explicit: boolean;
  external_url: string;
  images: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
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
