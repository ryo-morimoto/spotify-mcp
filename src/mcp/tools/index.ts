// Tool schemas
export { searchSchema, type SearchArgs } from './search.ts';
export { playerControlSchema, type PlayerControlArgs } from './playerControl.ts';

// Tool handlers
export { handleSearch } from './search.ts';
export { handlePlayerState } from './playerState.ts';
export { handlePlayerControl } from './playerControl.ts';

// TODO: Add more MCP tools [LOW]
// - [ ] playlist_create: Create and manage playlists
// - [ ] playlist_modify: Add/remove tracks from playlists
// - [ ] recommendations: Get track recommendations
// - [ ] audio_features: Get audio analysis of tracks
// - [ ] user_profile: Get user information
// - [ ] devices: List and manage playback devices
// See: src/TODO.md - Extended MCP Tools section
