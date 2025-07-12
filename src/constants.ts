// OAuth scopes required for Spotify API access
export const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-library-modify",
  "user-top-read",
  "user-read-recently-played",
] as const;

export type SpotifyScope = (typeof SPOTIFY_SCOPES)[number];
