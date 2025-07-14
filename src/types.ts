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
  images: ReadonlyArray<SpotifyImageObject>;
};

// Spotify artist type for search results
export type SpotifyArtistResult = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: number;
  external_url: string;
  images: ReadonlyArray<SpotifyImageObject>;
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
  images: ReadonlyArray<SpotifyImageObject>;
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
  images: ReadonlyArray<SpotifyImageObject>;
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
  images: ReadonlyArray<SpotifyImageObject>;
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
  images: ReadonlyArray<SpotifyImageObject>;
};

// Spotify-specific constants
export const SPOTIFY_TRACK_MIME_TYPE = "application/x-spotify-track" as const;

// Brand type utility
type Brand<K, T> = K & { __brand: T };

// Spotify resource IDs (prevents mixing different ID types)
export type SnapshotId = Brand<string, "SnapshotId">;
export type SpotifyTrackId = Brand<string, "SpotifyTrackId">;
export type SpotifyAlbumId = Brand<string, "SpotifyAlbumId">;
export type SpotifyArtistId = Brand<string, "SpotifyArtistId">;
export type SpotifyPlaylistId = Brand<string, "SpotifyPlaylistId">;
export type SpotifyUserId = Brand<string, "SpotifyUserId">;
export type SpotifyClientId = Brand<string, "SpotifyClientId">;
export type SpotifyAccessToken = Brand<string, "SpotifyAccessToken">;
export type SpotifyRefreshToken = Brand<string, "SpotifyRefreshToken">;

// Spotify API enums
export type RepeatState = "off" | "track" | "context";
export type AlbumType = "album" | "single" | "compilation";
export type ItemType = "track" | "episode";

// Common utilities
type Nullable<T> = T | null;

// Base types
export type SpotifyImageObject = {
  readonly url: string;
  readonly height: Nullable<number>;
  readonly width: Nullable<number>;
};

type WithId<T extends string> = {
  readonly id: T;
};

type WithName = {
  readonly name: string;
};

type SpotifyUserBasic = WithId<string> & {
  readonly display_name: Nullable<string>;
};

// Pagination
type PaginationOptions = {
  readonly limit?: number;
  readonly offset?: number;
};

type ExtendOptions<T, U> = T & Partial<U>;

export type GetSavedItemsOptions = ExtendOptions<PaginationOptions, { readonly market: string }>;

export type SpotifyPaginatedResult<T> = Readonly<{
  href: string;
  items: ReadonlyArray<T>;
  limit: number;
  next: Nullable<string>;
  offset: number;
  previous: Nullable<string>;
  total: number;
}>;

// Complex types
type SpotifyPlaylistOwner = SpotifyUserBasic;

// Domain types
export type PlaylistSummary = WithId<SpotifyPlaylistId> &
  WithName & {
    readonly description: Nullable<string>;
    readonly owner: SpotifyPlaylistOwner;
    readonly images: ReadonlyArray<SpotifyImageObject>;
    readonly tracks: {
      readonly total: number;
    };
    readonly public: Nullable<boolean>;
    readonly collaborative: boolean;
    readonly external_url: string;
  };

// Artist top track result (simplified for tool output)
export type SpotifyTopTrackResult = {
  id: string;
  name: string;
  artists: string;
  album: string;
  duration: string; // Format: "3:15"
  popularity: number;
  external_url: string;
};

// Playlist item result
export type PlaylistItemResult = {
  readonly added_at: string;
  readonly added_by: SpotifyUserBasic;
  readonly is_local: boolean;
  readonly track: SpotifyTrackResult | SpotifyEpisodeResult | null;
};

// Saved item types
export type SavedTrack = {
  readonly added_at: string;
  readonly track: SpotifyTrackResult;
};

export type SavedAlbum = {
  readonly added_at: string;
  readonly album: SpotifyAlbumResult;
};

// Paginated type aliases
export type PaginatedPlaylists = SpotifyPaginatedResult<PlaylistSummary>;
export type PaginatedTracks = SpotifyPaginatedResult<SpotifyTrackResult>;
export type PaginatedAlbums = SpotifyPaginatedResult<SpotifyAlbumResult>;
export type PaginatedArtists = SpotifyPaginatedResult<SpotifyArtistResult>;
export type PaginatedSavedTracks = SpotifyPaginatedResult<SavedTrack>;
export type PaginatedSavedAlbums = SpotifyPaginatedResult<SavedAlbum>;

// Common result types
export type SnapshotResult = Readonly<{
  snapshot_id: string;
}>;

export type OperationCountResult = Readonly<{
  items_added?: number;
  items_removed?: number;
}>;

export type SnapshotWithCountResult = SnapshotResult & OperationCountResult;

export type SuccessResult = Readonly<{
  success: boolean;
  message: string;
}>;

export type ImageResult = Readonly<{
  images: ReadonlyArray<SpotifyImageObject>;
}>;

// Playlist operation results
export type PlaylistModificationResult = SnapshotWithCountResult;
export type PlaylistSnapshotResult = SnapshotResult;

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
